// A sound's wave as numbers: its highs and lows by column, from its channels as an
// AudioBuffer's getChannelData gives them, each sample -1 to 1, and their outline to draw.
// Wave (wave.tsx) draws them.

/** Each of `columns` columns' lowest and highest, -1 to 1, across every channel given. */
export function peaksOf(channels: Float32Array[], columns: number): [number, number][] {
  const length = Math.max(0, ...channels.map((c) => c.length))
  if (!length || columns < 1) return []
  const peaks: [number, number][] = []
  for (let col = 0; col < columns; col++) {
    const from = Math.floor((col * length) / columns)
    const to = Math.max(from + 1, Math.floor(((col + 1) * length) / columns))
    let low = 0
    let high = 0
    for (const channel of channels) {
      for (let i = from; i < to && i < channel.length; i++) {
        if (channel[i] < low) low = channel[i]
        if (channel[i] > high) high = channel[i]
      }
    }
    peaks.push([Math.max(-1, low), Math.min(1, high)])
  }
  return peaks
}

/** The outline of `peaks` in a box `peaks.length` wide and 2 high, 0 at the top: along the
 *  highs, then back along the lows. */
export function outlineOf(peaks: [number, number][]): string {
  if (!peaks.length) return ''
  const highs = peaks.map(([, high], i) => `${i + 0.5},${1 - high}`)
  const lows = peaks.map(([low], i) => `${i + 0.5},${1 - low}`).reverse()
  return `M${[...highs, ...lows].join(' L')} Z`
}
