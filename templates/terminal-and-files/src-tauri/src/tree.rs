// The open app's files, for the file tree in the Files column
// (web/src/file-tree/FileTree.tsx), and word to the window when they change.
//
// - The tree: folders before files, each in name order; build output,
//   dependencies and version control never shown (SKIP); at most
//   MAX_ENTRIES, so a huge folder opened by mistake gives a partial tree
//   rather than stalling the app.
// - Watching: the folder watched as a whole (notify 8.2, its
//   `recommended_watcher` with an mpsc channel and RecursiveMode::Recursive:
//   the crate's lib.rs, read 2026-10-17), changes gathered for DEBOUNCE --
//   an edit or a build touches many files at once -- then sent to the
//   window as `fs-changed` with the paths, from the folder, outside SKIP.
//   Claude edits files; without this the tree goes stale.

use notify::{RecursiveMode, Watcher};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub const SKIP: &[&str] = &["node_modules", "target", ".git", "dist", ".vite", ".DS_Store"];
/// The app's own folder in the open app: the conversation the chat mod
/// writes (builder/mod/thrifty-builder-chat). Watched, so the chat moves,
/// but not shown in the tree.
pub const APP_DIR: &str = ".thrifty-builder";
const MAX_ENTRIES: usize = 20_000;
const DEBOUNCE: Duration = Duration::from_millis(300);

#[derive(Serialize)]
pub struct FileNode {
    pub name: String,
    /// From the folder, "/" between parts; "" for the folder itself.
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

pub fn tree(root: &Path) -> FileNode {
    let mut budget = MAX_ENTRIES;
    let name = root.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    FileNode { name, path: String::new(), children: Some(walk(root, "", &mut budget)) }
}

fn walk(dir: &Path, rel: &str, budget: &mut usize) -> Vec<FileNode> {
    let Ok(entries) = std::fs::read_dir(dir) else { return Vec::new() };
    let (mut dirs, mut files) = (Vec::new(), Vec::new());
    for entry in entries.flatten() {
        if *budget == 0 {
            break;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        if SKIP.contains(&name.as_str()) || (rel.is_empty() && name == APP_DIR) {
            continue;
        }
        *budget -= 1;
        let path = if rel.is_empty() { name.clone() } else { format!("{rel}/{name}") };
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            let children = walk(&entry.path(), &path, budget);
            dirs.push(FileNode { name, path, children: Some(children) });
        } else {
            files.push(FileNode { name, path, children: None });
        }
    }
    dirs.sort_by(|a, b| a.name.cmp(&b.name));
    files.sort_by(|a, b| a.name.cmp(&b.name));
    dirs.extend(files);
    dirs
}

/// A changed path, from the folder, unless it is in SKIP.
fn relevant(root: &Path, p: &Path) -> Option<String> {
    let rel = p.strip_prefix(root).ok()?;
    if rel.components().any(|c| SKIP.contains(&c.as_os_str().to_string_lossy().as_ref())) {
        return None;
    }
    Some(rel.to_string_lossy().replace('\\', "/"))
}

/// Watches `root` until the watcher it returns is dropped (the app closed).
pub fn watch(app: AppHandle, root: PathBuf) -> Result<notify::RecommendedWatcher, String> {
    let (tx, rx) = mpsc::channel::<notify::Result<notify::Event>>();
    let mut watcher = notify::recommended_watcher(tx).map_err(|e| e.to_string())?;
    watcher.watch(&root, RecursiveMode::Recursive).map_err(|e| e.to_string())?;
    std::thread::spawn(move || {
        let mut batch: Vec<String> = Vec::new();
        loop {
            match rx.recv_timeout(DEBOUNCE) {
                Ok(Ok(ev)) => {
                    for p in ev.paths {
                        if let Some(r) = relevant(&root, &p) {
                            if !batch.contains(&r) && batch.len() < 500 {
                                batch.push(r);
                            }
                        }
                    }
                }
                Ok(Err(_)) => {}
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    if !batch.is_empty() {
                        let _ = app.emit("fs-changed", std::mem::take(&mut batch));
                    }
                }
                // The watcher was dropped: the thread ends with it.
                Err(mpsc::RecvTimeoutError::Disconnected) => break,
            }
        }
    });
    Ok(watcher)
}

#[cfg(test)]
mod tests {
    use super::{relevant, tree};
    use std::path::Path;

    #[test]
    fn folders_first_in_name_order_and_build_output_left_out() {
        let root = std::env::temp_dir().join(format!("thrifty-builder-tree-{}", std::process::id()));
        for d in ["src/pages", "node_modules/x", ".git", "kit"] {
            std::fs::create_dir_all(root.join(d)).unwrap();
        }
        for f in ["b.txt", "a.md", "src/App.tsx", "src/pages/Home.tsx", "node_modules/x/i.js"] {
            std::fs::write(root.join(f), "").unwrap();
        }
        let t = tree(&root);
        let names: Vec<_> = t.children.as_ref().unwrap().iter().map(|n| n.name.as_str()).collect();
        assert_eq!(names, ["kit", "src", "a.md", "b.txt"]);
        let src = &t.children.as_ref().unwrap()[1];
        assert_eq!(src.children.as_ref().unwrap()[0].path, "src/pages");
        assert_eq!(src.children.as_ref().unwrap()[1].path, "src/App.tsx");
    }

    #[test]
    fn a_change_in_build_output_is_not_reported() {
        let root = Path::new("/a/app");
        assert_eq!(relevant(root, Path::new("/a/app/src/App.tsx")).as_deref(), Some("src/App.tsx"));
        assert_eq!(relevant(root, Path::new("/a/app/node_modules/x/i.js")), None);
        assert_eq!(relevant(root, Path::new("/a/app/kit/dist/index.js")), None);
    }
}
