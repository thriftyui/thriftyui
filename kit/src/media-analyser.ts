// An <audio> or <video> element's sound, measured as it plays, for a
// visualizer or a level: the element routed through a Web Audio analyser,
// then a gain for its volume, and on to the speakers. The analyser comes
// before the volume, so what is drawn does not shrink as it is turned down.
// An element can be routed into an audio graph only once, so each one's
// graph is made once and kept.

const made = new WeakMap<HTMLMediaElement, { analyser: AnalyserNode; gain: GainNode }>()

function graphOf(media: HTMLMediaElement, fftSize: number) {
  let graph = made.get(media)
  if (!graph) {
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = fftSize
    const gain = context.createGain()
    context.createMediaElementSource(media).connect(analyser)
    analyser.connect(gain)
    gain.connect(context.destination)
    graph = { analyser, gain }
    made.set(media, graph)
  }
  return graph
}

/** The analyser an element plays through, made the first time it is asked
 *  for, and its audio context resumed. Call it from a press: a browser starts
 *  sound only after the person acts. `fftSize` is used when it is made.
 *  @defaultValue `{ fftSize: 2048 }` */
export function mediaAnalyser(media: HTMLMediaElement, { fftSize = 2048 }: { fftSize?: number } = {}): AnalyserNode {
  const { analyser } = graphOf(media, fftSize)
  if (analyser.context.state === 'suspended') void (analyser.context as AudioContext).resume()
  return analyser
}

/** Sets an element's volume, 0 to 1, eased over a few hundredths of a
 *  second so it does not click, independently of the system's volume. */
export function setMediaVolume(media: HTMLMediaElement, volume: number) {
  const { gain } = graphOf(media, 2048)
  gain.gain.setTargetAtTime(Math.min(1, Math.max(0, volume)), gain.context.currentTime, 0.02)
}

/** How loud the analyser hears now: the root mean square of its waveform,
 *  0 for silence and about 0.1 for ordinary speech. Pass a buffer of
 *  `analyser.fftSize` to read into, to make none each frame. */
export function audioLevel(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer> = new Float32Array(analyser.fftSize)): number {
  analyser.getFloatTimeDomainData(buffer)
  let sum = 0
  for (const v of buffer) sum += v * v
  return Math.sqrt(sum / buffer.length)
}
