import { useEffect, useState } from 'react'
import { useMediaQuery } from 'thriftyui/use-media-query'
import { setDark } from 'thriftyui/set-dark'

/** Light or dark as the system is, by the .dark class the kit's theme
 *  uses; public/first-theme.js sets it before the first paint. Shown inside another
 *  page of the same site (ThriftyUI's site shows the starters in frames),
 *  it takes the theme that page asks for: in the address at first
 *  (?theme=light or dark), then by message -- { thriftyuiTheme: 'light' |
 *  'dark' } -- once it says it is ready for one ({ thriftyuiReady }). */
export function useSystemDark() {
  const system = useMediaQuery('(prefers-color-scheme: dark)')
  // Asked for in the address first (?theme=), so the first paint and the
  // first render agree (public/first-theme.js); then as the framing page sends it.
  const [sent, setSent] = useState<boolean | null>(() => {
    const asked = new URLSearchParams(location.search).get('theme')
    return asked === 'dark' ? true : asked === 'light' ? false : null
  })
  const dark = sent ?? system
  useEffect(() => {
    setDark(dark)
  }, [dark])
  useEffect(() => {
    if (window.parent === window) return
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return
      const t = e.data?.thriftyuiTheme
      if (t === 'light' || t === 'dark') setSent(t === 'dark')
    }
    addEventListener('message', on)
    window.parent.postMessage({ thriftyuiReady: true }, location.origin)
    return () => removeEventListener('message', on)
  }, [])
}
