import type { VerletPoint } from "./point";
import { add, dot, length, scale, sub, type Vec2 } from "./vec2";

/**
 * A one-sided line-segment surface (arena floor or platform). Collision only
 * resolves against the side the segment's normal faces, which is derived from
 * winding order: walking from `a` to `b`, the surface faces the left side of
 * that direction (so a left-to-right floor segment faces up).
 */
export interface Segment {
  a: Vec2;
  b: Vec2;
}

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

// A point mid-relaxation can sit a few pixels past a surface it's genuinely
// resting on (12 constraint iterations don't always fully cancel a tug from
// a competing bone) without that being a real "always on the far side" case.
// Tolerating shallow penetration keeps resting contact self-correcting while
// still treating a deep, sustained penetration (e.g. a point resting under a
// floating platform) as the far side, not a contact to resolve.
const RESOLVE_TOLERANCE = 24;

/**
 * Clamps a point back onto a segment's face when it has penetrated past it,
 * generalizing the flat-floor clamp to arbitrary position/tilt. Mirrors the
 * flat floor's friction behavior: only the tangential (along-surface) implied
 * velocity bleeds off, leaving the normal component of `prevPos` untouched so
 * this generalizes exactly to the axis-aligned case rather than changing feel.
 *
 * `frameStartPos` is the point's position from before this frame's constraint
 * relaxation began (see `solver.step`), used only to decide *whether* to
 * resolve — never `point.prevPos`, which angle constraints deliberately
 * mutate mid-frame to stay velocity-neutral and so can't serve as a stable
 * "which side was it on" reference.
 */
export function resolveSegmentCollision(
  point: VerletPoint,
  segment: Segment,
  friction: number,
  frameStartPos: Vec2,
): void {
  if (point.pinned) return;

  const dir = sub(segment.b, segment.a);
  const segLength = length(dir);
  if (segLength === 0) return;

  const tangent = scale(dir, 1 / segLength);
  const normal: Vec2 = { x: tangent.y, y: -tangent.x };

  const t = clamp01(dot(sub(point.pos, segment.a), tangent) / segLength);
  const closest = add(segment.a, scale(tangent, t * segLength));
  const penetration = dot(sub(point.pos, closest), normal);
  if (penetration >= 0) return;

  // One-sided means "resolve a crossing," not "snap anything on the wrong
  // side": without this check, a point that starts (and stays) below a
  // *finite* floating segment — e.g. standing under a platform overhead —
  // reads as permanently penetrating from any distance and gets teleported
  // onto it. Requiring the frame-start position to have been on the near
  // side makes platforms passable from underneath while a full-width floor
  // (which nothing spawns beneath) resolves exactly as before.
  const startT = clamp01(dot(sub(frameStartPos, segment.a), tangent) / segLength);
  const startClosest = add(segment.a, scale(tangent, startT * segLength));
  const startPenetration = dot(sub(frameStartPos, startClosest), normal);
  if (startPenetration < -RESOLVE_TOLERANCE) return;

  point.pos = closest;

  const tangentialVelocity = dot(sub(point.pos, point.prevPos), tangent);
  point.prevPos = add(point.prevPos, scale(tangent, tangentialVelocity * friction));
}
