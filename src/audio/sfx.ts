export type SfxName = "step" | "swing" | "impact" | "knockout" | "uiClick";

export interface SfxEngine {
  context: AudioContext | null;
  masterGain: GainNode | null;
  muted: boolean;
  lastPlayedAt: Partial<Record<SfxName, number>>;
}

const MUTE_STORAGE_KEY = "ragdoll-rumble:muted";

/** Minimum seconds between repeats of the same SFX, so rapid input can't turn into noise mush. */
const THROTTLE_SECONDS: Record<SfxName, number> = {
  step: 0.15,
  swing: 0.08,
  impact: 0.08,
  knockout: 1,
  uiClick: 0.05,
};

function readStoredMute(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
}

function writeStoredMute(muted: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
}

/**
 * Builds the engine's state eagerly — safe to call at module load in any
 * environment, including a test's Node runtime with no AudioContext at all —
 * but leaves `context` null until `ensureAudioContext` runs from a real user
 * gesture. Every browser's autoplay policy rejects (or silently suspends) an
 * AudioContext created any earlier than that.
 */
export function createSfxEngine(): SfxEngine {
  return { context: null, masterGain: null, muted: readStoredMute(), lastPlayedAt: {} };
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/** Idempotent: call from every user-gesture handler that might be the first one; a second call is a no-op. */
export function ensureAudioContext(engine: SfxEngine): void {
  if (engine.context) return;

  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) return;

  engine.context = new AudioContextCtor();
  engine.masterGain = engine.context.createGain();
  engine.masterGain.gain.value = engine.muted ? 0 : 1;
  engine.masterGain.connect(engine.context.destination);
}

export function isMuted(engine: SfxEngine): boolean {
  return engine.muted;
}

export function setMuted(engine: SfxEngine, muted: boolean): void {
  engine.muted = muted;
  writeStoredMute(muted);
  if (engine.masterGain) engine.masterGain.gain.value = muted ? 0 : 1;
}

export function toggleMute(engine: SfxEngine): boolean {
  setMuted(engine, !engine.muted);
  return engine.muted;
}

/** True (and records the attempt) only if `name` isn't still inside its own throttle window. */
function shouldPlay(engine: SfxEngine, name: SfxName): boolean {
  if (!engine.context) return false;

  const now = engine.context.currentTime;
  const last = engine.lastPlayedAt[name];
  if (last !== undefined && now - last < THROTTLE_SECONDS[name]) return false;

  engine.lastPlayedAt[name] = now;
  return true;
}

interface ToneOptions {
  type: OscillatorType;
  startFreq: number;
  endFreq?: number;
  duration: number;
  gain: number;
}

/** A single oscillator with a linear frequency ramp and an exponential decay envelope. */
function playTone(
  engine: SfxEngine,
  { type, startFreq, endFreq, duration, gain }: ToneOptions,
): void {
  const { context, masterGain } = engine;
  if (!context || !masterGain) return;

  const now = context.currentTime;
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  if (endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
  }

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(envelope).connect(masterGain);
  osc.start(now);
  osc.stop(now + duration);
}

interface NoiseOptions {
  duration: number;
  gain: number;
  filterFrequency: number;
  filterType?: BiquadFilterType;
}

/** A short burst of white noise through a filter, with the same decay envelope shape as playTone. */
function playNoise(
  engine: SfxEngine,
  { duration, gain, filterFrequency, filterType = "lowpass" }: NoiseOptions,
): void {
  const { context, masterGain } = engine;
  if (!context || !masterGain) return;

  const now = context.currentTime;
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFrequency;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter).connect(envelope).connect(masterGain);
  source.start(now);
  source.stop(now + duration);
}

/** A footstep: a short, quiet low sine blip. */
export function playStep(engine: SfxEngine): void {
  if (!shouldPlay(engine, "step")) return;
  playTone(engine, { type: "sine", startFreq: 90, duration: 0.05, gain: 0.06 });
}

/** A punch/kick/lunge thrown but not (necessarily) landed: filtered noise with a fast decay. */
export function playSwing(engine: SfxEngine): void {
  if (!shouldPlay(engine, "swing")) return;
  playNoise(engine, { duration: 0.09, gain: 0.12, filterFrequency: 1400, filterType: "bandpass" });
}

/** A landed hit: a square wave with a fast pitch drop, layered with a short noise "crunch." */
export function playImpact(engine: SfxEngine): void {
  if (!shouldPlay(engine, "impact")) return;
  playTone(engine, { type: "square", startFreq: 220, endFreq: 60, duration: 0.12, gain: 0.18 });
  playNoise(engine, { duration: 0.06, gain: 0.14, filterFrequency: 900 });
}

/** The knockout stinger — the one SFX allowed to be loud, a short rising square-wave arpeggio. */
export function playKnockout(engine: SfxEngine): void {
  if (!shouldPlay(engine, "knockout")) return;
  const { context, masterGain } = engine;
  if (!context || !masterGain) return;

  const notes = [220, 277, 330, 440];
  const noteDuration = 0.09;
  notes.forEach((freq, i) => {
    const start = context.currentTime + i * noteDuration;
    const osc = context.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.22, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + noteDuration);

    osc.connect(envelope).connect(masterGain);
    osc.start(start);
    osc.stop(start + noteDuration);
  });
}

/** A UI click: short triangle-wave blip for menu/button interactions. */
export function playUiClick(engine: SfxEngine): void {
  if (!shouldPlay(engine, "uiClick")) return;
  playTone(engine, { type: "triangle", startFreq: 520, duration: 0.04, gain: 0.1 });
}
