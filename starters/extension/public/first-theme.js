// Dark before the first paint: as the address asks (?theme=dark or light,
// when ThriftyUI's site shows this page in a frame), else as the system
// is; use-system-dark.ts keeps it in step after. A file of its own, not
// inline: an extension page's policy is "script-src 'self'", which "won't
// run inline Javascript" and "cannot be relaxed" (developer.chrome.com,
// Manifest, content_security_policy, read 2026-10-16).
const asked = new URLSearchParams(location.search).get('theme')
if (asked ? asked === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark')
