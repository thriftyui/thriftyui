import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { outlineOf, peaksOf } from './wave-peaks.ts'
import { Wave } from './wave.tsx'

// A sound's highs and lows by column, as an AudioBuffer's channels (getChannelData) give them,
// and the wave drawn from them: a picture, hidden from a screen reader.

describe('peaksOf', () => {
  it('finds each column’s lowest and highest across every channel', () => {
    const left = new Float32Array([0.5, -0.25, 0, 0, 0.1, 0.2])
    const right = new Float32Array([0, 0, -0.75, 0.25, 0, -0.1])
    expect(peaksOf([left, right], 3)).toEqual([
      [-0.25, 0.5],
      [-0.75, 0.25],
      [-0.1, 0.2].map((v) => Math.fround(v)) as [number, number],
    ])
  })

  it('gives every column a sample even when there are fewer samples than columns', () => {
    const peaks = peaksOf([new Float32Array([1, -1])], 4)
    expect(peaks).toHaveLength(4)
    expect(peaks[0]).toEqual([0, 1])
    expect(peaks[3]).toEqual([-1, 0])
  })

  it('keeps within -1 and 1, and gives nothing for no sound', () => {
    expect(peaksOf([new Float32Array([2, -3])], 1)).toEqual([[-1, 1]])
    expect(peaksOf([], 10)).toEqual([])
    expect(peaksOf([new Float32Array([0.5])], 0)).toEqual([])
  })
})

describe('Wave', () => {
  it('draws the highs then the lows, hidden from a screen reader, its line where it plays', async () => {
    const peaks: [number, number][] = [
      [-0.5, 0.5],
      [-1, 1],
    ]
    expect(outlineOf(peaks)).toBe('M0.5,0.5 L1.5,0 L1.5,2 L0.5,1.5 Z')
    const { container, rerender } = render(<Wave peaks={peaks} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('viewBox')).toBe('0 0 2 2')
    expect(container.querySelector('line')).toBeNull()
    rerender(<Wave peaks={peaks} at={0.25} />)
    expect(container.querySelector('line')?.getAttribute('x1')).toBe('0.5')
    await expectNoA11yViolations(container)
  })
})
