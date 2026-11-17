// The project open in the window, the ones opened before, and making a new
// one. The window starts on the start screen (src/StartScreen.tsx): New
// project and Recent; opening one shows it, and Claude Code starts in its
// folder (terminal.rs). Close project goes back to the start.
//
// Opening and the recent list are Thrifty Builder's
// (ThriftyUI's repository: builder/src-tauri/src/folder.rs): `recent.json` in
// the app's data folder (Tauri's PathResolver, `app_data_dir`), at most
// MAX_RECENT, newest first; a folder that has gone is left out when the
// list is read.
//
// A new project is a blank folder, named by the user, and nothing in it -- no
// template, no rules. Its name a plain folder name; the folder new, or there
// and empty, never one with files in it.

use serde::Serialize;
use std::path::{Path, PathBuf};

const MAX_RECENT: usize = 10;

#[derive(Clone, Serialize)]
pub struct FolderInfo {
    pub root: String,
    pub name: String,
    pub recent: Vec<String>,
}

pub fn read_recent(file: &Path) -> Vec<String> {
    let list: Vec<String> = std::fs::read_to_string(file).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default();
    list.into_iter().filter(|p| Path::new(p).is_dir()).collect()
}

/// `root` first, then the rest as they were, at most MAX_RECENT.
fn put_first(list: Vec<String>, root: &str) -> Vec<String> {
    let mut out = vec![root.to_string()];
    out.extend(list.into_iter().filter(|p| p != root));
    out.truncate(MAX_RECENT);
    out
}

/// The folder at `path`, made the newest of the recent list.
pub fn open(path: &str, recent_file: &Path) -> Result<(PathBuf, FolderInfo), String> {
    let root = std::fs::canonicalize(path).map_err(|e| format!("{path}: {e}"))?;
    if !root.is_dir() {
        return Err(format!("{} is not a folder", root.display()));
    }
    let root_text = root.to_string_lossy().into_owned();
    let recent = put_first(read_recent(recent_file), &root_text);
    if let Some(dir) = recent_file.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    std::fs::write(recent_file, serde_json::to_string_pretty(&recent).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let name = root.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| root_text.clone());
    Ok((root, FolderInfo { root: root_text, name, recent }))
}

/// A blank project: the folder `<parent>/<name>`, made with nothing in it.
pub fn create_blank(parent: &Path, name: &str) -> Result<PathBuf, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Give the project a name.".into());
    }
    if name.starts_with('.') || name.contains(['/', '\\', ':']) {
        return Err(format!("\"{name}\" can't be a folder's name: no slashes or colons, and not starting with a dot."));
    }
    let root = parent.join(name);
    if root.exists() {
        let empty = std::fs::read_dir(&root).map_err(|e| e.to_string())?.flatten().all(|e| e.file_name() == ".DS_Store");
        if !root.is_dir() || !empty {
            return Err(format!("{} is already there and not empty.", root.display()));
        }
    }
    std::fs::create_dir_all(&root).map_err(|e| format!("Could not make {}: {e}", root.display()))?;
    Ok(root)
}

#[cfg(test)]
mod tests {
    use super::{create_blank, open, put_first, read_recent};

    fn scratch(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("terminal-and-files-test-{name}-{}", std::process::id()));
        let _ = std::fs::create_dir_all(&dir);
        dir
    }

    #[test]
    fn the_opened_folder_comes_first_once_and_the_list_is_kept_short() {
        let list: Vec<String> = (0..12).map(|i| format!("/f{i}")).collect();
        let out = put_first(list, "/f5");
        assert_eq!(out[0], "/f5");
        assert_eq!(out.iter().filter(|p| *p == "/f5").count(), 1);
        assert_eq!(out.len(), 10);
    }

    #[test]
    fn opening_writes_the_list_and_a_gone_folder_is_left_out() {
        let base = scratch("recent");
        let a = base.join("a");
        let b = base.join("b");
        std::fs::create_dir_all(&a).unwrap();
        std::fs::create_dir_all(&b).unwrap();
        let file = base.join("data").join("recent.json");
        open(a.to_str().unwrap(), &file).unwrap();
        let (_, info) = open(b.to_str().unwrap(), &file).unwrap();
        assert_eq!(info.name, "b");
        assert!(info.recent[0].ends_with("/b") && info.recent[1].ends_with("/a"));
        std::fs::write(&file, format!("[\"{}\", \"/no/such/folder\"]", a.display())).unwrap();
        assert_eq!(read_recent(&file).len(), 1);
        assert!(open("/no/such/folder", &file).is_err());
    }

    #[test]
    fn a_new_project_is_an_empty_folder_and_never_one_with_files() {
        let base = scratch("blank");
        // Its parent made if it is not there.
        let made = create_blank(&base.join("Projects"), "  My Project ").unwrap();
        assert!(made.ends_with("Projects/My Project"));
        assert_eq!(std::fs::read_dir(&made).unwrap().count(), 0);
        // There and empty: used.
        assert!(create_blank(&base.join("Projects"), "My Project").is_ok());
        // There with a file: refused, the file kept.
        std::fs::write(made.join("notes.md"), "mine").unwrap();
        assert!(create_blank(&base.join("Projects"), "My Project").unwrap_err().contains("not empty"));
        assert_eq!(std::fs::read_to_string(made.join("notes.md")).unwrap(), "mine");
        for bad in ["", " ", "a/b", "..", ".hidden", "x:y"] {
            assert!(create_blank(&base, bad).is_err(), "{bad:?}");
        }
    }
}
