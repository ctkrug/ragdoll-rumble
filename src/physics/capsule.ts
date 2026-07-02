import type { VerletPoint } from "./point";
import { add, dot, length, scale, sub, type Vec2 } from "./vec2";

/** A thick line segment between two Verlet points; a and b may be the same point for a circle. */
export interface Capsule {
  a: VerletPoint;
  b: VerletPoint;
  radius: number;
}

export function createCapsule(a: VerletPoint, b: VerletPoint, radius: number): Capsule {
  return { a, b, radius };
}

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

/**
 * Closest points between segments p1-q1 and p2-q2, returned as the parametric
 * position (0..1) along each segment. Standard closest-point-between-segments
 * algorithm (Ericson, "Real-Time Collision Detection" 5.1.9).
 */
export function closestPointsBetweenSegments(
  p1: Vec2,
  q1: Vec2,
  p2: Vec2,
  q2: Vec2,
): { s: number; t: number } {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  const EPS = 1e-9;

  if (a <= EPS && e <= EPS) return { s: 0, t: 0 };
  if (a <= EPS) return { s: 0, t: clamp01(f / e) };

  const c = dot(d1, r);
  if (e <= EPS) return { s: clamp01(-c / a), t: 0 };

  const b = dot(d1, d2);
  const denom = a * e - b * b;
  let s = denom !== 0 ? clamp01((b * f - c * e) / denom) : 0;

  let t = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = clamp01(-c / a);
  } else if (t > 1) {
    t = 1;
    s = clamp01((b - c) / a);
  }

  return { s, t };
}

/**
 * Pushes two overlapping capsules apart along the line between their closest
 * points, distributing the correction across each capsule's endpoints by how
 * close each one is to the contact point (mirrors satisfyDistanceConstraint's
 * pinned-aware split).
 */
export function resolveCapsuleCollision(capsuleA: Capsule, capsuleB: Capsule): void {
  const { s, t } = closestPointsBetweenSegments(
    capsuleA.a.pos,
    capsuleA.b.pos,
    capsuleB.a.pos,
    capsuleB.b.pos,
  );
  const c1 = add(capsuleA.a.pos, scale(sub(capsuleA.b.pos, capsuleA.a.pos), s));
  const c2 = add(capsuleB.a.pos, scale(sub(capsuleB.b.pos, capsuleB.a.pos), t));

  const delta = sub(c2, c1);
  const dist = length(delta);
  const minDist = capsuleA.radius + capsuleB.radius;
  if (dist === 0 || dist >= minDist) return;

  const normal = scale(delta, 1 / dist);
  const overlap = minDist - dist;
  const push = scale(normal, overlap / 2);

  applyWeightedPush(capsuleA.a, capsuleA.b, s, scale(push, -1));
  applyWeightedPush(capsuleB.a, capsuleB.b, t, push);
}

function applyWeightedPush(a: VerletPoint, b: VerletPoint, t: number, push: Vec2): void {
  if (a === b) {
    if (!a.pinned) a.pos = add(a.pos, push);
    return;
  }

  if (!a.pinned) a.pos = add(a.pos, scale(push, 1 - t));
  if (!b.pinned) b.pos = add(b.pos, scale(push, t));
}
