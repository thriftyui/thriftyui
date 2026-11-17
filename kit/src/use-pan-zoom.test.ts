import { describe, expect, it } from 'vitest'
import { fitScale, keepInside, zoomAbout } from './use-pan-zoom.ts'

describe('zoomAbout', () => {
  it('keeps the point under the pointer where it is', () => {
    const v = zoomAbout({ scale: 1, x: 0, y: 0 }, 2, 100, 50)
    expect(v).toEqual({ scale: 2, x: -100, y: -50 })
    // The content point under (100, 50) before, (100, 50), is under it after: 100 = -100 + 100 * 2.
    expect(v.x + 100 * 2).toBe(100)
  })
})

describe('fitScale', () => {
  it('covers the box, or fits inside it', () => {
    expect(fitScale({ width: 1000, height: 1000 }, { width: 400, height: 300 }, 'cover')).toBe(0.4)
    expect(fitScale({ width: 1000, height: 1000 }, { width: 400, height: 300 }, 'contain')).toBe(0.3)
  })
})

describe('keepInside', () => {
  const content = { width: 1000, height: 1000 }
  const box = { width: 400, height: 300 }

  it('keeps the zoom between its least and most', () => {
    expect(keepInside({ scale: 9, x: 0, y: 0 }, content, box, 0.4, 1, 4).scale).toBe(4)
    expect(keepInside({ scale: 0.2, x: 0, y: 0 }, content, box, 0.4, 1, 4).scale).toBe(1)
  })

  it('never pulls an edge in where the content is larger than the box', () => {
    // At the fit to cover, 400 x 400 in a 400 x 300 box: across it fills exactly; down, 100 to spare.
    expect(keepInside({ scale: 1, x: 50, y: 50 }, content, box, 0.4)).toEqual({ scale: 1, x: 0, y: 0 })
    expect(keepInside({ scale: 1, x: 0, y: -500 }, content, box, 0.4)).toEqual({ scale: 1, x: 0, y: -100 })
  })

  it('centres the content where it is smaller than the box', () => {
    // Fitted inside, 300 x 300 in 400 x 300: 50 either side across.
    expect(keepInside({ scale: 1, x: -80, y: 20 }, content, box, 0.3)).toEqual({ scale: 1, x: 50, y: 0 })
  })
})
