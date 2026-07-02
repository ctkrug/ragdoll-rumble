export type Rng = () => number;

/**
 * Deterministic PRNG (mulberry32) so a match's arena is reproducible from its
 * seed alone — no stored state beyond the one number, and the same seed
 * always yields the same call sequence across runs/platforms.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return function rng(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random number in [min, max) drawn from the given generator. */
export function randRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}
