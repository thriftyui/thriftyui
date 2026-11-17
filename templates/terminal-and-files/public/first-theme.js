// Before the first paint, the theme and finish as src/settings.ts keeps
// them (light, dark, or as the system is; metal, none, zebra or leopard),
// so the window does not flash the other way. A file, not inline, so the app's
// Content-Security-Policy (src-tauri/tauri.conf.json) needs no exception.
let saved = {}
try {
  saved = JSON.parse(localStorage.getItem('terminal-and-files-settings') ?? '{}')
} catch {}
const dark = saved.theme === 'dark' || (saved.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
if (dark) document.documentElement.classList.add('dark')
document.documentElement.dataset.finish = ['none', 'zebra', 'leopard'].includes(saved.finish) ? saved.finish : 'metal'
