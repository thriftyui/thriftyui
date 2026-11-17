// The terminal in the right column: Claude Code, run by the user's shell on a
// pseudo-terminal, drawn in the page by ghostty-web (src/Terminal.tsx). The
// shell starts `claude` and ends when it
// does, and the chat is drawn from the same session.
//
// The pseudo-terminal is portable-pty's (0.9.0, part of WezTerm; its
// lib.rs and examples/bash.rs, read 2026-10-17): `openpty` gives the pair,
// the command is spawned on its slave side, the master side is read for
// output and written for input, and `resize` tells the shell the new size.
// The shell is the user's own -- $SHELL, or the password database's
// (`CommandBuilder::get_shell`, cmdbuilder.rs) -- run as an interactive
// login shell (`-i -l`), so both its profile and its rc file run, as in
// their own terminal: `claude` is often put on PATH only by the rc file
// (seen 2026-10-17: ~/.zshrc adds ~/.local/bin, where claude is; a login
// shell that is not interactive did not find it). It runs `claude` and
// nothing else (`-c`), signed in as in the user's own terminal.
//
// CLAUDE_CODE_NO_FLICKER=1: fullscreen, so the box stays at the bottom and
// a resize redraws the whole screen; set this way, a session the app stops
// before it has fully started is not counted as a failed fullscreen start,
// which would put the user's own terminal sessions on the classic renderer
// too (code.claude.com/docs/en/fullscreen.md, "Fullscreen by default" and
// "How Claude Code counts failed starts", read 2026-10-17).
//
// Output goes to the page over a Tauri channel, the one given at start:
// "Channels are designed to be fast and deliver ordered data. They are used
// internally for streaming operations such as ... child process output"
// (tauri-docs, develop/calling-frontend.mdx, Channels). Each start has its
// own channel and id, so a stopped shell's output never reaches a new one.
//
// It starts in the folder of the app open in the window (folder.rs).

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::ipc::Channel;

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum TermEvent {
    Output(String),
    Exit,
}

pub struct Term {
    pub id: u64,
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

fn size(cols: u16, rows: u16) -> PtySize {
    PtySize { rows: rows.max(2), cols: cols.max(10), pixel_width: 0, pixel_height: 0 }
}

/// `s` as one shell word: in single quotes, each of its own written '\''.
fn shell_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}

/// Variables of a Claude Code session the app was started from (seen
/// 2026-10-17: started by Claude Code, the app had CLAUDECODE=1,
/// CLAUDE_CODE_SESSION_ID, CLAUDE_CODE_MESSAGING_TOKEN, CLAUDE_PID and
/// more). They belong to that session, so the shell does not get them;
/// started from Finder or a terminal of the user's own, there are none.
fn parent_session_vars(vars: impl Iterator<Item = String>) -> Vec<String> {
    let vars: Vec<String> = vars.collect();
    if !vars.iter().any(|k| k == "CLAUDECODE") {
        return Vec::new();
    }
    vars.into_iter().filter(|k| k == "CLAUDECODE" || k == "CLAUDE_PID" || k == "CLAUDE_EFFORT" || k.starts_with("CLAUDE_CODE_")).collect()
}

/// The whole UTF-8 at the front of `pending`; a character cut in two by a
/// read waits for the rest (std::str::Utf8Error: `valid_up_to`, and
/// `error_len` None when the input ended mid-character). A byte that is
/// not UTF-8 at all is passed on as U+FFFD rather than held.
fn take_utf8(pending: &mut Vec<u8>) -> String {
    let whole = match std::str::from_utf8(pending) {
        Ok(_) => pending.len(),
        Err(e) if e.error_len().is_none() => e.valid_up_to(),
        Err(_) => pending.len(),
    };
    let rest = pending.split_off(whole);
    let text = String::from_utf8_lossy(pending).into_owned();
    *pending = rest;
    text
}

/// The shell line that starts Claude Code: with `--plugin-dir` for a plugin, its path quoted for the
/// shell; carrying on the folder's most recent conversation (`--continue`, the CLI reference), and
/// where there is none -- `claude --continue` then says "No conversation found to continue" and
/// exits 1 (seen 2026-11-12, v2.1.322) -- the screen cleared and a new one started.
pub fn launch_line(plugin: Option<&Path>, continue_last: bool) -> String {
    let claude = match plugin {
        Some(p) => format!("claude --plugin-dir {}", shell_quote(&p.display().to_string())),
        None => "claude".to_owned(),
    };
    if continue_last {
        format!("{claude} --continue || {{ printf '\\033[H\\033[2J'; {claude}; }}")
    } else {
        claude
    }
}

impl Term {
    /// Runs Claude Code in the open folder, in the user's own login shell,
    /// so `claude` is found as in their terminal; with a plugin for that session when the app gives
    /// one, and the folder's last conversation carried on when asked (`launch_line`).
    pub fn start(root: &Path, cols: u16, rows: u16, plugin: Option<&Path>, continue_last: bool, events: Channel<TermEvent>) -> Result<Term, String> {
        let pair = native_pty_system().openpty(size(cols, rows)).map_err(|e| e.to_string())?;
        let shell = CommandBuilder::new_default_prog().get_shell();
        let mut cmd = CommandBuilder::new(&shell);
        let launch = launch_line(plugin, continue_last);
        cmd.args(["-i", "-l", "-c", &launch]);
        cmd.cwd(root);
        cmd.env("CLAUDE_CODE_NO_FLICKER", "1");
        // A terminal of 256 colours and true colour, as ghostty-web draws.
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        for key in parent_session_vars(std::env::vars().map(|(k, _)| k)) {
            cmd.env_remove(key);
        }
        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        // Dropped once spawned, so the output ends when the shell does
        // (examples/bash.rs does the same).
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
        let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
        std::thread::spawn(move || {
            let mut chunk = [0u8; 16384];
            let mut pending = Vec::new();
            loop {
                match reader.read(&mut chunk) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => {
                        pending.extend_from_slice(&chunk[..n]);
                        let text = take_utf8(&mut pending);
                        if !text.is_empty() && events.send(TermEvent::Output(text)).is_err() {
                            break;
                        }
                    }
                }
            }
            let _ = events.send(TermEvent::Exit);
        });
        Ok(Term { id, master: pair.master, writer, child })
    }

    pub fn write(&mut self, data: &str) -> Result<(), String> {
        self.writer.write_all(data.as_bytes()).and_then(|_| self.writer.flush()).map_err(|e| e.to_string())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master.resize(size(cols, rows)).map_err(|e| e.to_string())
    }

    pub fn stop(mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

#[cfg(test)]
mod tests {
    use super::{parent_session_vars, size, take_utf8};
    use portable_pty::{native_pty_system, CommandBuilder};
    use std::io::Read;

    #[test]
    fn a_quoted_path_reaches_the_shell_as_one_word() {
        let path = "/tmp/a dir/it's $HOME.json";
        let out = std::process::Command::new("/bin/sh").args(["-c", &format!("printf %s {}", super::shell_quote(path))]).output().unwrap();
        assert_eq!(String::from_utf8(out.stdout).unwrap(), path);
    }

    #[test]
    fn the_launch_line_carries_on_the_last_conversation_or_starts_a_new_one() {
        use std::path::Path;
        assert_eq!(super::launch_line(None, false), "claude");
        assert_eq!(super::launch_line(Some(Path::new("/a b/p")), false), "claude --plugin-dir '/a b/p'");
        let line = super::launch_line(Some(Path::new("/p")), true);
        assert_eq!(line, "claude --plugin-dir '/p' --continue || { printf '\\033[H\\033[2J'; claude --plugin-dir '/p'; }");
        // The shell runs the second when the first fails, as `claude --continue` does with no conversation.
        let tried = line.replace("claude", "false").replacen("false --plugin-dir '/p'; }", "echo new; }", 1);
        let out = std::process::Command::new("/bin/sh").args(["-c", &tried]).output().unwrap();
        assert!(String::from_utf8_lossy(&out.stdout).ends_with("new\n"));
    }

    #[test]
    fn a_character_cut_by_a_read_waits_for_the_rest() {
        // "é" is C3 A9; the first read stops after C3.
        let mut pending = b"caf\xC3".to_vec();
        assert_eq!(take_utf8(&mut pending), "caf");
        assert_eq!(pending, vec![0xC3]);
        pending.extend_from_slice(b"\xA9!");
        assert_eq!(take_utf8(&mut pending), "\u{e9}!");
        assert!(pending.is_empty());
        let mut bad = b"a\xFFb".to_vec();
        assert_eq!(take_utf8(&mut bad), "a\u{FFFD}b");
        assert!(bad.is_empty());
    }

    #[test]
    fn a_parent_sessions_variables_are_left_out_and_only_then() {
        let keys = |list: &[&str]| list.iter().map(|s| s.to_string()).collect::<Vec<_>>().into_iter();
        let mut out = parent_session_vars(keys(&["CLAUDECODE", "CLAUDE_CODE_SESSION_ID", "CLAUDE_PID", "PATH", "CLAUDE_CONFIG_DIR"]));
        out.sort();
        assert_eq!(out, vec!["CLAUDECODE", "CLAUDE_CODE_SESSION_ID", "CLAUDE_PID"]);
        assert!(parent_session_vars(keys(&["CLAUDE_CODE_SCROLL_SPEED", "PATH"])).is_empty());
    }

    #[test]
    fn the_shell_sees_a_terminal_of_the_size_asked_and_its_end_ends_the_output() {
        let pair = native_pty_system().openpty(size(97, 31)).unwrap();
        let mut cmd = CommandBuilder::new("/bin/sh");
        cmd.args(["-c", "test -t 1 && echo tty; stty size"]);
        let mut child = pair.slave.spawn_command(cmd).unwrap();
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().unwrap();
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let mut out = String::new();
            let _ = reader.read_to_string(&mut out);
            let _ = tx.send(out);
        });
        child.wait().unwrap();
        let out = rx.recv_timeout(std::time::Duration::from_secs(10)).expect("the output did not end with the program");
        assert!(out.contains("tty"), "not a terminal: {out:?}");
        assert!(out.contains("31 97"), "wrong size: {out:?}");
    }
}
