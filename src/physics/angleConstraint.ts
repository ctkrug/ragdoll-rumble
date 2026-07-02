import type { VerletPoint } from "./point";
import { add, cross, dot, length, scale, sub } from "./vec2";

/**
 * Limits the bend at joint `b` between anchor `a` and end `c` (e.g. shoulder-elbow-hand).
 * The signed angle from vector b->a to vector b->c is clamped to [minAngle, maxAngle],
 * where an angle near +/-Math.PI means the limb is straight. Because the signed angle
 * wraps at +/-Math.PI, hyperextension past straight reads as a large-magnitude negative
 * angle, so setting minAngle > 0 rejects both over-bending and bending the wrong way.
 */
export interface AngleConstraint {
  a: VerletPoint;
  b: VerletPoint;
  c: VerletPoint;
  minAngle: number;
  maxAngle: number;
}

export function createAngleConstraint(
  a: VerletPoint,
  b: VerletPoint,
  c: VerletPoint,
  minAngle: number,
  maxAngle: number,
): AngleConstraint {
  return { a, b, c, minAngle, maxAngle };
}

/** Rotates `c` around `b` to bring the joint angle back within range, preserving bone length. */
export function satisfyAngleConstraint(constraint: AngleConstraint): void {
  const { a, b, c, minAngle, maxAngle } = constraint;
  const v1 = sub(a.pos, b.pos);
  const v2 = sub(c.pos, b.pos);
  const len2 = length(v2);
  if (len2 === 0) return;

  const angle = Math.atan2(cross(v1, v2), dot(v1, v2));
  const clamped = Math.min(Math.max(angle, minAngle), maxAngle);
  if (clamped === angle) return;

  const baseAngle = Math.atan2(v1.y, v1.x);
  const targetAngle = baseAngle + clamped;
  const newV2 = scale({ x: Math.cos(targetAngle), y: Math.sin(targetAngle) }, len2);
  c.pos = add(b.pos, newV2);
}
