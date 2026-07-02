import { floorHeightAt, type Arena } from "../arena/generator";
import { length, sub } from "../physics/vec2";
import type { Ragdoll } from "../ragdoll/skeleton";

/** Beyond this fraction of arena width past either edge, a ragdoll is knocked off-arena. */
const OFF_ARENA_MARGIN_FRACTION = 0.06;

/** Above this uprightness (0 = flat, 1 = vertical) the torso doesn't read as "on its back." */
const PINNED_MAX_UPRIGHTNESS = 0.35;
/** Within this fraction of arena height above the floor still counts as "down." */
const PINNED_MAX_FLOOR_GAP_FRACTION = 0.12;

/**
 * True once a ragdoll's pelvis has been flung past the arena's playable
 * edge. The floor itself always spans the full arena width (so a grounded
 * ragdoll can't physically leave it — see docs/ARCHITECTURE.md), but a hit
 * can still fling limbs off-screen mid-air before gravity brings them back
 * down; that's the moment this is meant to catch.
 */
export function isOffArena(ragdoll: Ragdoll, arena: Arena): boolean {
  const margin = arena.width * OFF_ARENA_MARGIN_FRACTION;
  const { x, y } = ragdoll.points.pelvis.pos;
  return x < -margin || x > arena.width + margin || y > arena.height + margin;
}

/**
 * True this instant if a ragdoll is lying flat on the floor — the frame-level
 * signal a match's pin timer accumulates against to turn "briefly stumbled"
 * into a real knockout. Checked against the floor specifically, not
 * platforms: getting pinned on a platform isn't a mechanic yet.
 */
export function isPinnedFlat(ragdoll: Ragdoll, arena: Arena): boolean {
  const { neck, pelvis } = ragdoll.points;
  const torso = sub(pelvis.pos, neck.pos);
  const torsoLength = length(torso);
  if (torsoLength === 0) return false;

  const uprightness = Math.abs(torso.y) / torsoLength;
  if (uprightness > PINNED_MAX_UPRIGHTNESS) return false;

  const floorY = floorHeightAt(arena, pelvis.pos.x);
  const gapAboveFloor = floorY - pelvis.pos.y;
  return gapAboveFloor < arena.height * PINNED_MAX_FLOOR_GAP_FRACTION;
}
