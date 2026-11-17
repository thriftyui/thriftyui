import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Video } from './video.tsx'

/** jsdom has no media playback: the video's state, held by hand. */
function stub(video: HTMLVideoElement, duration = 125) {
  let paused = true
  let time = 0
  let muted = false
  const fire = (type: string) => act(() => void video.dispatchEvent(new Event(type)))
  Object.defineProperties(video, {
    paused: { get: () => paused },
    duration: { get: () => duration },
    currentTime: { get: () => time, set: (t: number) => ((time = t), fire('timeupdate')) },
    muted: { get: () => muted, set: (m: boolean) => ((muted = m), fire('volumechange')) },
  })
  video.play = () => ((paused = false), fire('play'), Promise.resolve())
  video.pause = () => ((paused = true), fire('pause'))
  fire('durationchange')
}

describe('Video', () => {
  it('is a named group with its controls, the seek bar out of use until the video has a length', async () => {
    const { container } = render(<Video label="A walk in the park" src="walk.mp4" />)
    const group = screen.getByRole('group', { name: 'A walk in the park' })
    const video = group.querySelector('video')!
    expect(video.hasAttribute('controls')).toBe(false)
    expect(video.hasAttribute('playsinline')).toBe(true)
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
    // Radix's disabled thumb: marked, and out of the tab order.
    const seek = screen.getByRole('slider', { name: 'Seek' })
    expect([seek.hasAttribute('data-disabled'), seek.hasAttribute('tabindex')]).toEqual([true, false])
    await expectNoA11yViolations(container)
  })

  it('plays and pauses by its button and by K; the button says what it will do', async () => {
    const user = userEvent.setup()
    render(<Video label="Clip" src="clip.mp4" />)
    stub(document.querySelector('video')!)
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
    await user.keyboard('k')
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
  })

  it("gives the seek bar its length and the time in words, the W3C's seek slider's", () => {
    render(<Video label="Clip" src="clip.mp4" />)
    const video = document.querySelector('video')!
    stub(video)
    const seek = screen.getByRole('slider', { name: 'Seek' })
    expect(seek.getAttribute('aria-valuemax')).toBe('125')
    expect(seek.getAttribute('aria-valuetext')).toBe('0 seconds of 2 minutes 5 seconds')
    video.currentTime = 63
    expect(seek.getAttribute('aria-valuetext')).toBe('1 minute 3 seconds of 2 minutes 5 seconds')
    expect(screen.getByText('1:03 / 2:05')).toBeTruthy()
  })

  it('skips 5 seconds by Left and Right, and mutes by M, while focus is inside it', async () => {
    const user = userEvent.setup()
    render(<Video label="Clip" src="clip.mp4" />)
    const video = document.querySelector('video')!
    stub(video)
    screen.getByRole('button', { name: 'Play' }).focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(video.currentTime).toBe(10)
    await user.keyboard('{ArrowLeft}')
    expect(video.currentTime).toBe(5)
    await user.keyboard('m')
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
    // Outside the player, the letters are the page's.
    act(() => (document.activeElement as HTMLElement).blur())
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(video.muted).toBe(true)
  })

  it('turns captions on and off by C, goes full screen by F, and moves ten seconds on the seek bar by Page Up and Page Down', async () => {
    // jsdom has neither text tracks nor full screen: a captions track and
    // the browser's full screen, stood in for.
    const track = Object.assign(new EventTarget(), { kind: 'captions', mode: 'showing' as TextTrackMode, activeCues: [] })
    const list = Object.assign(new EventTarget(), { 0: track, length: 1 })
    const tracks = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'textTracks')
    Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', { configurable: true, get: () => list })
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    const requested = vi.fn(() => Promise.resolve())
    const request = HTMLElement.prototype.requestFullscreen
    HTMLElement.prototype.requestFullscreen = requested
    try {
      const user = userEvent.setup()
      render(<Video label="Clip" src="clip.mp4" />)
      const video = document.querySelector('video')!
      stub(video)
      expect(track.mode).toBe('hidden')
      screen.getByRole('button', { name: 'Play' }).focus()
      await user.keyboard('c')
      expect(track.mode).toBe('disabled')
      await user.keyboard('c')
      expect(track.mode).toBe('hidden')
      await user.keyboard('f')
      expect(requested).toHaveBeenCalledTimes(1)
      screen.getByRole('slider', { name: 'Seek' }).focus()
      await user.keyboard('{PageUp}')
      expect(video.currentTime).toBe(10)
      await user.keyboard('{PageUp}{PageDown}')
      expect(video.currentTime).toBe(10)
    } finally {
      if (tracks) Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', tracks)
      else delete (HTMLMediaElement.prototype as { textTracks?: unknown }).textTracks
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
      HTMLElement.prototype.requestFullscreen = request
    }
  })

  it('writes an hour or more with its hours', () => {
    render(<Video label="Clip" src="clip.mp4" />)
    const video = document.querySelector('video')!
    stub(video, 3725)
    video.currentTime = 3600
    expect(screen.getByText('1:00:00 / 1:02:05')).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Seek' }).getAttribute('aria-valuetext')).toBe('1 hour of 1 hour 2 minutes 5 seconds')
  })
})
