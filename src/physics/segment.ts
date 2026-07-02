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

/**
 * Clamps a point back onto a segment's face when it has penetrated past it,
 * generalizing the flat-floor clamp to arbitrary position/tilt. Mirrors the
 * flat floor's friction behavior: only the tangential (along-surface) implied
 * velocity bleeds off, leaving the normal component of `prevPos` untouched so
 * this generalizes exactly to the axis-aligned case rather than changing feel.
 */
export function resolveSegmentCollision(
  point: VerletPoint,
  segment: Segment,
  friction: number,
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

  point.pos = closest;

  const tangentialVelocity = dot(sub(point.pos, point.prevPos), tangent);
  point.prevPos = add(point.prevPos, scale(tangent, tangentialVelocity * friction));
}
