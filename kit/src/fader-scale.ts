// The scales a mixer's fader and level meter are drawn on: a gain's place on the fader, Ardour's
// (control_math.h, gain_to_position), its top +12 dB; a level's height on the meter, Ardour's
// (logmeter.h, log_meter); and how fast a meter falls and how long it holds a peak.

/** The fader's top, in dB. */
export const FADER_TOP_DB = 12
const TOP_GAIN = 10 ** (FADER_TOP_DB / 20)

/** A fader's place, 0 (silence) to 1 (+12 dB), as a gain. */
export function gainAt(position: number): number {
  if (position <= 0) return 0
  return 2 ** ((position ** (1 / 8) * 198 - 192) / 6) * (TOP_GAIN / 2)
}

/** A gain's place on the fader, 0 to 1. */
export function positionOf(gain: number): number {
  if (gain <= 0) return 0
  return Math.min(1, Math.max(0, ((6 * Math.log2((gain * 2) / TOP_GAIN) + 192) / 198) ** 8))
}

/** A gain in dB, silence as -Infinity; and back. */
export const toDb = (gain: number): number => (gain <= 0 ? -Infinity : 20 * Math.log10(gain))
export const fromDb = (db: number): number => (db === -Infinity ? 0 : 10 ** (db / 20))

/** A level in dBFS as the meter's height, 0 to 1: 100 at 0 dBFS and 115 at +6, its top. */
export function meterHeight(db: number): number {
  let def: number
  if (db < -70) def = 0
  else if (db < -60) def = (db + 70) * 0.25
  else if (db < -50) def = (db + 60) * 0.5 + 2.5
  else if (db < -40) def = (db + 50) * 0.75 + 7.5
  else if (db < -30) def = (db + 40) * 1.5 + 15
  else if (db < -20) def = (db + 30) * 2 + 30
  else if (db < 6) def = (db + 20) * 2.5 + 50
  else def = 115
  return def / 115
}

/** How fast a meter falls, dB a second, and how long a peak and a clip stay shown, in seconds. */
export const METER_FALL = 13.3
export const METER_HOLD = 3

/** A level meter's pieces (fader.tsx, LevelMeter), drawn each frame by `showLevel`. */
export interface LevelMeterParts {
  fill: HTMLElement
  peak: HTMLElement
  clip: HTMLElement
}

/** Draws a level meter: its `level` and held `peak` in dBFS on the meter's scale, and its clip
 *  light on while `clipped`. Called from a frame loop, so it sets styles, not React state. */
export function showLevel(parts: LevelMeterParts, { level, peak, clipped }: { level: number; peak: number; clipped: boolean }) {
  parts.fill.style.height = `${meterHeight(level) * 100}%`
  parts.peak.style.bottom = `${meterHeight(peak) * 100}%`
  parts.peak.style.opacity = peak > -70 ? '1' : '0'
  if (clipped) parts.clip.dataset.on = ''
  else delete parts.clip.dataset.on
}
