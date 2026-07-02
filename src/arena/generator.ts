import type { Segment } from "../physics/segment";
import { createRng, randRange } from "./prng";

export interface Arena {
  width: number;
  height: number;
  seed: number;
  /** A single segment spanning the full width; tilted by a seeded amount. */
  floor: Segment;
  /** Floating one-sided platforms, high enough to clear a standing ragdoll. */
  platforms: Segment[];
  /** floor + platforms, ready to hand to World.geometry. */
  geometry: Segment[];
}

const FLOOR_Y_FRACTION = 0.85;
/** Max floor height difference between the arena's left and right edges, as a fraction of height. */
const FLOOR_TILT_FRACTION = 0.05;
const MIN_PLATFORM_COUNT = 1;
const MAX_PLATFORM_COUNT = 3;
const PLATFORM_WIDTH_MIN_FRACTION = 0.12;
const PLATFORM_WIDTH_MAX_FRACTION = 0.22;
/** Platforms sit in this band (fraction of height) so they clear a standing ragdoll's head. */
const PLATFORM_Y_MIN_FRACTION = 0.15;
const PLATFORM_Y_MAX_FRACTION = 0.35;

/**
 * Builds a reproducible arena for the given seed: a floor tilted by a small
 * seeded amount, plus one to three floating platforms. Same width/height/seed
 * always yields the same layout, so a match can be replayed or shared by seed.
 */
export function generateArena(width: number, height: number, seed: number): Arena {
  const rng = createRng(seed);

  const baseFloorY = height * FLOOR_Y_FRACTION;
  const halfTilt = (randRange(rng, -FLOOR_TILT_FRACTION, FLOOR_TILT_FRACTION) * height) / 2;
  const floor: Segment = {
    a: { x: 0, y: baseFloorY - halfTilt },
    b: { x: width, y: baseFloorY + halfTilt },
  };

  const platformCount = Math.floor(randRange(rng, MIN_PLATFORM_COUNT, MAX_PLATFORM_COUNT + 1));
  const platforms: Segment[] = [];
  for (let i = 0; i < platformCount; i++) {
    const platformWidth = randRange(
      rng,
      width * PLATFORM_WIDTH_MIN_FRACTION,
      width * PLATFORM_WIDTH_MAX_FRACTION,
    );
    const centerX = randRange(rng, platformWidth / 2, width - platformWidth / 2);
    const y = randRange(rng, height * PLATFORM_Y_MIN_FRACTION, height * PLATFORM_Y_MAX_FRACTION);
    platforms.push({
      a: { x: centerX - platformWidth / 2, y },
      b: { x: centerX + platformWidth / 2, y },
    });
  }

  return { width, height, seed, floor, platforms, geometry: [floor, ...platforms] };
}

/** The floor's height at a given x, linearly interpolated across its tilt. */
export function floorHeightAt(arena: Arena, x: number): number {
  const { a, b } = arena.floor;
  const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
  const clamped = Math.min(Math.max(t, 0), 1);
  return a.y + (b.y - a.y) * clamped;
}
