'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Captions, CaptionsOff, Maximize, Minimize, Pause, PictureInPicture2, Play, Volume2, VolumeX } from 'lucide-react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'
import { Slider } from './slider.tsx'

// A video with the kit's controls: the browser's <video>, inline on a
// phone (playsinline), its own controls off, and a bar of the kit's over
// its foot. Its <source> and <track> elements are its children.
//
// The seek bar is the kit's Slider, its value in words as the W3C's media
// seek slider gives it. Captions are the first captions or subtitles
// track, set `hidden` so the browser does not draw it, and drawn by the kit
// above the bar so the bar never covers them.
//
// An iPhone has no full screen for an element, so there it is the video's
// own (webkitEnterFullscreen); iOS cannot set the volume, so the volume
// slider shows only where it can. The bar fades while playing and still,
// and comes back on a move, a tap or focus. The player never starts itself.
//
// Keys while focus is inside it, the only time WCAG 2.1.4 lets a single
// letter act: K play or pause, M mute, F full screen, C captions, Left and
// Right five seconds (except on the seek bar, whose arrows are its own).

/** How long the bar stays after the last move while playing, in ms. */
const IDLE = 2500
/** How far Left and Right skip, in seconds. */
const SKIP = 5

/** 75 => "1:15"; 3725 => "1:02:05". */
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** 63 => "1 minute 3 seconds", the W3C's media seek slider's words. */
function timeInWords(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const parts = [h && unit(h, 'hour'), m && unit(m, 'minute'), (s % 60 || s === 0) && unit(s % 60, 'second')]
  return parts.filter(Boolean).join(' ')
}

/** Whether a page may set a video's volume: not on iOS, where it reads 1. */
let volumeSettable: boolean | undefined
function canSetVolume() {
  if (volumeSettable === undefined) {
    const probe = document.createElement('video')
    probe.volume = 0.5
    volumeSettable = probe.volume === 0.5
  }
  return volumeSettable
}

type AppleVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void }

const captionsTrack = (video: HTMLVideoElement) =>
  Array.from(video.textTracks ?? []).find((t) => t.kind === 'captions' || t.kind === 'subtitles')

/** A cue's text without its WebVTT tags (<v Name>, <i>, <b>). */
const cueText = (cue: TextTrackCue) => ('text' in cue ? String(cue.text) : '').replace(/<[^>]+>/g, '')

/** A video with the kit's controls: the browser's <video>, inline on a
 *  phone, with a bar of play, the seek bar, the time, captions, sound,
 *  picture in picture and full screen. Named by `label`; its <source> and
 *  <track> elements are its children. */
export function Video({
  label,
  className,
  children,
  ...props
}: Omit<ComponentProps<'video'>, 'controls'> & {
  /** Names the player: what the video is. */
  label: string
}) {
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<AppleVideo>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(Boolean(props.muted))
  const [volume, setVolume] = useState(1)
  const [captions, setCaptions] = useState<boolean | null>(null)
  const [cue, setCue] = useState('')
  const [full, setFull] = useState(false)
  const [pip, setPip] = useState(false)
  const [idle, setIdle] = useState(false)
  // What the browser offers, known once mounted.
  const [can, setCan] = useState({ full: false, pip: false, volume: false })

  useEffect(() => {
    const v = video.current
    if (!v) return
    setCan({
      full: document.fullscreenEnabled || typeof v.webkitEnterFullscreen === 'function',
      pip: Boolean(document.pictureInPictureEnabled) && !v.disablePictureInPicture,
      volume: canSetVolume(),
    })
    const sync = () => {
      setPlaying(!v.paused)
      setTime(v.currentTime)
      setDuration(Number.isFinite(v.duration) ? v.duration : 0)
      setMuted(v.muted)
      setVolume(v.volume)
    }
    const events = ['play', 'pause', 'ended', 'timeupdate', 'durationchange', 'loadedmetadata', 'volumechange', 'seeked']
    events.forEach((e) => v.addEventListener(e, sync))
    const inPip = () => setPip(true)
    const outPip = () => setPip(false)
    v.addEventListener('enterpictureinpicture', inPip)
    v.addEventListener('leavepictureinpicture', outPip)
    const onFull = () => setFull(document.fullscreenElement === frame.current)
    document.addEventListener('fullscreenchange', onFull)
    sync()

        // The captions track, set hidden wherever the browser would show it,
        // as the kit draws it.
    let track: TextTrack | undefined
    const showCue = () => setCue(track?.mode === 'hidden' ? Array.from(track.activeCues ?? []).map(cueText).join('\n') : '')
    const onTracks = () => {
      const found = captionsTrack(v)
      if (found !== track) {
        track?.removeEventListener('cuechange', showCue)
        track = found
        track?.addEventListener('cuechange', showCue)
      }
      if (!track) return
      if (track.mode === 'showing') track.mode = 'hidden'
      setCaptions(track.mode === 'hidden')
    }
    onTracks()
    // A TextTrackList is an EventTarget; where one is not (jsdom), captions
    // are left out.
    const tracks = typeof v.textTracks?.addEventListener === 'function' ? v.textTracks : undefined
    tracks?.addEventListener('addtrack', onTracks)
    tracks?.addEventListener('change', onTracks)
    return () => {
      events.forEach((e) => v.removeEventListener(e, sync))
      v.removeEventListener('enterpictureinpicture', inPip)
      v.removeEventListener('leavepictureinpicture', outPip)
      document.removeEventListener('fullscreenchange', onFull)
      tracks?.removeEventListener('addtrack', onTracks)
      tracks?.removeEventListener('change', onTracks)
      track?.removeEventListener('cuechange', showCue)
    }
  }, [])

  // The bar's fade: after IDLE still while playing.
  const timer = useRef(0)
  const wake = () => {
    setIdle(false)
    window.clearTimeout(timer.current)
    if (video.current && !video.current.paused) timer.current = window.setTimeout(() => setIdle(true), IDLE)
  }
  useEffect(() => {
    if (playing) wake()
    else {
      window.clearTimeout(timer.current)
      setIdle(false)
    }
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const toggle = () => {
    const v = video.current
    if (!v) return
    // play() is a promise, refused when the browser will not play; the
    // button stays "Play" then, as `paused` stays true.
    if (v.paused) Promise.resolve(v.play()).catch(() => {})
    else v.pause()
  }
  const seek = (to: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = Math.min(Math.max(0, to), v.duration || 0)
    // Held here too, so the bar's thumb stays where it was put while the
    // browser seeks.
    setTime(v.currentTime)
  }
  const mute = () => {
    const v = video.current
    if (v) v.muted = !v.muted
  }
  const toggleCaptions = () => {
    const v = video.current
    const track = v && captionsTrack(v)
    if (!track) return
    const on = track.mode === 'disabled'
    track.mode = on ? 'hidden' : 'disabled'
    if (!on) setCue('')
    setCaptions(on)
  }
  const fullScreen = () => {
    const v = video.current
    const f = frame.current
    if (!v || !f) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else if (document.fullscreenEnabled) f.requestFullscreen().catch(() => {})
    else v.webkitEnterFullscreen?.()
  }
  const pictureInPicture = () => {
    const v = video.current
    if (!v) return
    if (document.pictureInPictureElement === v) document.exitPictureInPicture().catch(() => {})
    else v.requestPictureInPicture().catch(() => {})
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const onSlider = (e.target as HTMLElement).getAttribute('role') === 'slider'
    const key = e.key.toLowerCase()
    const v = video.current
    if (key === 'k') toggle()
    else if (key === 'm') mute()
    else if (key === 'f' && can.full) fullScreen()
    else if (key === 'c' && captions !== null) toggleCaptions()
    else if (!onSlider && v && e.key === 'ArrowLeft') seek(v.currentTime - SKIP)
    else if (!onSlider && v && e.key === 'ArrowRight') seek(v.currentTime + SKIP)
    else return
    e.preventDefault()
    wake()
  }

  // A tap with the bar hidden shows it; a press otherwise plays or pauses.
  const onPictureUp = (e: React.PointerEvent<HTMLVideoElement>) => {
    if (e.button !== 0) return
    if (e.pointerType !== 'mouse' && idle) wake()
    else toggle()
  }

  const ICON = buttonClass('ghost', 'icon', 'shrink-0')
  return (
    <div
      ref={frame}
      role="group"
      aria-label={label}
      data-idle={idle || undefined}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => e.pointerType === 'mouse' && wake()}
      onFocus={wake}
      className={cn(
        '@container/video relative overflow-hidden rounded-lg bg-black-a12 data-[idle]:cursor-none [&:fullscreen]:rounded-none [&:fullscreen_video]:h-full',
        className,
      )}
    >
      <video
        ref={video}
        playsInline
        preload="metadata"
        onPointerUp={onPictureUp}
        className="block h-auto w-full object-contain"
        {...props}
      >
        {children}
      </video>
      {cue && (
        <p
          className={cn(
            'pointer-events-none absolute inset-x-4 mx-auto w-fit max-w-[90%] rounded-md bg-neutral-1/95 px-2 py-1 text-center text-sm whitespace-pre-line text-neutral-12 motion-safe:transition-[bottom] motion-safe:duration-200 @md/video:text-base',
            idle ? 'bottom-4' : 'bottom-16',
          )}
        >
          {cue}
        </p>
      )}
      <div
        className={cn(
          'absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-lg border border-neutral-6 bg-neutral-1/95 px-1 text-neutral-12 motion-safe:transition-opacity motion-safe:duration-300',
          idle && 'pointer-events-none opacity-0',
        )}
      >
        <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className={ICON}>
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>
        <Slider
          aria-label="Seek"
          thumb="bar"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          value={[Math.floor(time)]}
          onValueChange={([to]) => seek(to)}
          valueText={(at) => `${timeInWords(at)} of ${timeInWords(duration)}`}
          disabled={duration === 0}
          className="mx-2 min-w-12 flex-1"
        />
        <span className="hidden shrink-0 px-1 font-mono text-xs text-neutral-12 tabular-nums @xs/video:block">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        {captions !== null && (
          <button type="button" aria-label="Captions" aria-pressed={captions} onClick={toggleCaptions} className={ICON}>
            {captions ? <Captions aria-hidden /> : <CaptionsOff aria-hidden />}
          </button>
        )}
        <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={mute} className={ICON}>
          {muted || volume === 0 ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
        </button>
        {can.volume && (
          <Slider
            aria-label="Volume"
            min={0}
            max={100}
            value={[muted ? 0 : Math.round(volume * 100)]}
            onValueChange={([to]) => {
              const v = video.current
              if (!v) return
              v.volume = to / 100
              v.muted = to === 0
            }}
            valueText={(v) => `${v}%`}
            className="mx-2 hidden w-16 shrink-0 @md/video:flex"
          />
        )}
        {can.pip && (
          <button
            type="button"
            aria-label={pip ? 'Leave picture in picture' : 'Picture in picture'}
            onClick={pictureInPicture}
            className={cn(ICON, 'hidden @sm/video:inline-flex')}
          >
            <PictureInPicture2 aria-hidden />
          </button>
        )}
        {can.full && (
          <button type="button" aria-label={full ? 'Leave full screen' : 'Full screen'} onClick={fullScreen} className={ICON}>
            {full ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
          </button>
        )}
      </div>
    </div>
  )
}
