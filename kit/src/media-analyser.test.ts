import { afterEach, describe, expect, it, vi } from 'vitest'
import { audioLevel, mediaAnalyser, setMediaVolume } from './media-analyser.ts'

// jsdom has no Web Audio: a stand-in AudioContext records what is made.

function fakeAudio() {
  const made = { contexts: 0, sources: 0, resumed: 0, volumes: [] as number[] }
  class FakeContext {
    state = 'suspended'
    destination = {}
    constructor() {
      made.contexts++
    }
    currentTime = 0
    createAnalyser() {
      return { context: this, fftSize: 2048, connect: vi.fn() }
    }
    createGain() {
      return { context: this, connect: vi.fn(), gain: { setTargetAtTime: (...a: number[]) => made.volumes.push(a[0]) } }
    }
    createMediaElementSource() {
      made.sources++
      return { connect: vi.fn() }
    }
    resume() {
      made.resumed++
      return Promise.resolve()
    }
  }
  vi.stubGlobal('AudioContext', FakeContext)
  return made
}

afterEach(() => vi.unstubAllGlobals())

describe('mediaAnalyser', () => {
  it('routes an element once, however often it is asked for, and resumes its context', () => {
    const made = fakeAudio()
    const audio = document.createElement('audio')
    const first = mediaAnalyser(audio, { fftSize: 1024 })
    const again = mediaAnalyser(audio)
    expect(again).toBe(first)
    expect(first.fftSize).toBe(1024)
    expect(made.contexts).toBe(1)
    expect(made.sources).toBe(1)
    expect(made.resumed).toBe(2)
    mediaAnalyser(document.createElement('audio'))
    expect(made.sources).toBe(2)
  })
})

describe('setMediaVolume', () => {
  it('eases the same graph to the volume, kept within 0 to 1', () => {
    const made = fakeAudio()
    const audio = document.createElement('audio')
    mediaAnalyser(audio)
    setMediaVolume(audio, 0.5)
    setMediaVolume(audio, 3)
    setMediaVolume(audio, -1)
    expect(made.sources).toBe(1)
    expect(made.volumes).toEqual([0.5, 1, 0])
  })
})

describe('audioLevel', () => {
  const analyserOf = (samples: number[]) => ({ fftSize: samples.length, getFloatTimeDomainData: (b: Float32Array) => b.set(samples) }) as unknown as AnalyserNode

  it('is 0 for silence and the root mean square otherwise', () => {
    expect(audioLevel(analyserOf([0, 0, 0, 0]))).toBe(0)
    expect(audioLevel(analyserOf([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5)
    expect(audioLevel(analyserOf([1, 0, -1, 0]))).toBeCloseTo(Math.SQRT1_2)
  })
})
