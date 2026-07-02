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
  /** 0 = no correction, 1 = fully snap to the limit in a single pass. */
  stiffness: number;
}

export function createAngleConstraint(
  a: VerletPoint,
  b: VerletPoint,
  c: VerletPoint,
  minAngle: number,
  maxAngle: number,
  stiffness = 1,
): AngleConstraint {
  return { a, b, c, minAngle, maxAngle, stiffness };
}

/**
 * Rotates `c` around `b` to bring the joint angle back within range, preserving
 * bone length. Shifts `c.prevPos` by the same delta as `c.pos`: without that,
 * this reposition would read as a burst of Verlet velocity (implicit velocity
 * is pos - prevPos), and since gravity re-violates the same joint the same way
 * every frame, that burst keeps re-injecting in one rotational direction and
 * the joint runs away instead of settling.
 */
export function satisfyAngleConstraint(constraint: AngleConstraint): void {
  const { a, b, c, minAngle, maxAngle, stiffness } = constraint;
  const v1 = sub(a.pos, b.pos);
  const v2 = sub(c.pos, b.pos);
  const len2 = length(v2);
  if (len2 === 0) return;

  const angle = Math.atan2(cross(v1, v2), dot(v1, v2));
  const clamped = Math.min(Math.max(angle, minAngle), maxAngle);
  if (clamped === angle) return;

  const correctedAngle = angle + (clamped - angle) * stiffness;
  const baseAngle = Math.atan2(v1.y, v1.x);
  const targetAngle = baseAngle + correctedAngle;
  const newV2 = scale({ x: Math.cos(targetAngle), y: Math.sin(targetAngle) }, len2);
  const newPos = add(b.pos, newV2);
  const delta = sub(newPos, c.pos);

  c.pos = newPos;
  c.prevPos = add(c.prevPos, delta);
}
