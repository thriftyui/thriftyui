// A file of the open app, read for the page's file view (src/FileView.tsx),
// read only: the app writes nothing there; edits are Claude's. A
// path is taken from the app's folder and refused if,
// with `..` and links followed, it lands outside it; text up to
// MAX_TEXT_BYTES and only if it is UTF-8; a picture's bytes as they are.

use std::path::{Path, PathBuf};

const MAX_TEXT_BYTES: u64 = 2 * 1024 * 1024;

pub fn resolve(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let p = root.join(rel).canonicalize().map_err(|e| format!("{rel}: {e}"))?;
    if !p.starts_with(&root) {
        return Err(format!("{rel} is outside the app's folder."));
    }
    Ok(p)
}

pub fn read_text(root: &Path, rel: &str) -> Result<String, String> {
    let p = resolve(root, rel)?;
    let len = std::fs::metadata(&p).map_err(|e| e.to_string())?.len();
    if len > MAX_TEXT_BYTES {
        return Err(format!("{rel} is {} MB, too large to show.", len / 1024 / 1024));
    }
    String::from_utf8(std::fs::read(&p).map_err(|e| e.to_string())?).map_err(|_| format!("{rel} is not a text file."))
}

pub fn read_bytes(root: &Path, rel: &str) -> Result<Vec<u8>, String> {
    std::fs::read(resolve(root, rel)?).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::{read_bytes, read_text};

    #[test]
    fn reads_inside_the_folder_only_and_text_only() {
        let base = std::env::temp_dir().join(format!("thrifty-builder-files-{}", std::process::id()));
        let root = base.join("app");
        std::fs::create_dir_all(&root).unwrap();
        std::fs::write(root.join("a.txt"), "hello").unwrap();
        std::fs::write(root.join("b.bin"), [0xff, 0xfe, 0x00]).unwrap();
        std::fs::write(base.join("secret.txt"), "no").unwrap();
        assert_eq!(read_text(&root, "a.txt").unwrap(), "hello");
        assert!(read_text(&root, "b.bin").unwrap_err().contains("not a text file"));
        assert_eq!(read_bytes(&root, "b.bin").unwrap(), vec![0xff, 0xfe, 0x00]);
        assert!(read_text(&root, "../secret.txt").unwrap_err().contains("outside"));
    }
}
