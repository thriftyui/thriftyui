mod files;
mod folder;
mod terminal;
mod tree;

use folder::FolderInfo;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{ipc::Channel, AppHandle, Manager, State};
use terminal::{Term, TermEvent};

/// The project open in the window and the terminal running in it, if any
/// (tauri-docs, develop/state-management.mdx: state behind a Mutex, read
/// in commands).
#[derive(Default)]
struct AppState {
  folder: Mutex<Option<PathBuf>>,
  term: Mutex<Option<Term>>,
  /// Watching the open project's files (tree.rs); dropped, it stops.
  watcher: Mutex<Option<notify::RecommendedWatcher>>,
}

fn recent_file(app: &AppHandle) -> Result<PathBuf, String> {
  app.path().app_data_dir().map(|d| d.join("recent.json")).map_err(|e| e.to_string())
}

/// The projects opened before, newest first (folder.rs).
#[tauri::command]
fn recent_folders(app: AppHandle) -> Result<Vec<String>, String> {
  Ok(folder::read_recent(&recent_file(&app)?))
}

/// Where New project puts a project unless told otherwise: "Projects" in
/// Documents (the home folder without one) -- a template people make their
/// own, so no app's name in it.
#[tauri::command]
fn default_parent(app: AppHandle) -> Result<String, String> {
  let base = app.path().document_dir().or_else(|_| app.path().home_dir()).map_err(|e| e.to_string())?;
  Ok(base.join("Projects").display().to_string())
}

/// Opens the project at `path`: it becomes the window's, and the newest of
/// the recent list. Any terminal running for the one before is stopped.
#[tauri::command]
fn open_folder(app: AppHandle, state: State<AppState>, path: String) -> Result<FolderInfo, String> {
  let (root, info) = folder::open(&path, &recent_file(&app)?)?;
  if let Some(old) = state.term.lock().unwrap().take() {
    old.stop();
  }
  *state.watcher.lock().unwrap() = Some(tree::watch(app, root.clone())?);
  *state.folder.lock().unwrap() = Some(root);
  Ok(info)
}

/// Makes a blank project (folder.rs) and opens it.
#[tauri::command]
fn new_project(app: AppHandle, state: State<AppState>, parent: String, name: String) -> Result<FolderInfo, String> {
  let root = folder::create_blank(std::path::Path::new(&parent), &name)?;
  open_folder(app, state, root.display().to_string())
}

/// Back to the start screen: the terminal stopped, no project open.
#[tauri::command]
fn close_folder(state: State<AppState>) {
  if let Some(old) = state.term.lock().unwrap().take() {
    old.stop();
  }
  *state.watcher.lock().unwrap() = None;
  *state.folder.lock().unwrap() = None;
}

fn open_root(state: &State<AppState>) -> Result<PathBuf, String> {
  state.folder.lock().unwrap().clone().ok_or_else(|| "No project is open".to_string())
}

/// A file's text (files.rs).
#[tauri::command]
fn read_text(state: State<AppState>, path: String) -> Result<String, String> {
  files::read_text(&open_root(&state)?, &path)
}

/// A file's bytes as they are -- a picture -- sent as an array buffer, not
/// JSON (tauri-docs, develop/calling-rust.mdx, "Returning Array Buffers").
#[tauri::command]
fn read_bytes(state: State<AppState>, path: String) -> Result<tauri::ipc::Response, String> {
  files::read_bytes(&open_root(&state)?, &path).map(tauri::ipc::Response::new)
}

/// The open folder's files as a tree (tree.rs).
#[tauri::command]
fn list_tree(state: State<AppState>) -> Result<tree::FileNode, String> {
  Ok(tree::tree(&open_root(&state)?))
}

#[derive(serde::Serialize)]
struct Started {
  id: u64,
}

/// Starts Claude Code in the open folder, stopping one already running; its
/// output and its end come over `on_event`. Returns its id, which the other
/// commands name.
#[tauri::command]
fn term_start(state: State<AppState>, cols: u16, rows: u16, on_event: Channel<TermEvent>) -> Result<Started, String> {
  let root = open_root(&state)?;
  let mut slot = state.term.lock().unwrap();
  if let Some(old) = slot.take() {
    old.stop();
  }
  let term = Term::start(&root, cols, rows, None, false, on_event)?;
  let id = term.id;
  *slot = Some(term);
  Ok(Started { id })
}

/// Keys typed, to the shell whose id is given; none other.
#[tauri::command]
fn term_write(state: State<AppState>, id: u64, data: String) -> Result<(), String> {
  match state.term.lock().unwrap().as_mut() {
    Some(t) if t.id == id => t.write(&data),
    _ => Ok(()),
  }
}

#[tauri::command]
fn term_resize(state: State<AppState>, id: u64, cols: u16, rows: u16) -> Result<(), String> {
  match state.term.lock().unwrap().as_ref() {
    Some(t) if t.id == id => t.resize(cols, rows),
    _ => Ok(()),
  }
}

#[tauri::command]
fn term_stop(state: State<AppState>) {
  if let Some(t) = state.term.lock().unwrap().take() {
    t.stop();
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.manage(AppState::default());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![recent_folders, default_parent, open_folder, new_project, close_folder, list_tree, read_text, read_bytes, term_start, term_write, term_resize, term_stop])
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    // Quitting stops the terminal the app started.
    .run(|app, event| {
      if let tauri::RunEvent::Exit = event {
        if let Some(t) = app.state::<AppState>().term.lock().unwrap().take() {
          t.stop();
        }
      }
    });
}
