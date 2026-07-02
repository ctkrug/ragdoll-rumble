import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { createAngleConstraint, satisfyAngleConstraint } from "../../src/physics/angleConstraint";
import { length, sub } from "../../src/physics/vec2";

function jointAngle(a: { pos: { x: number; y: number } }, b: typeof a, c: typeof a): number {
  const v1 = sub(a.pos, b.pos);
  const v2 = sub(c.pos, b.pos);
  return Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y);
}

describe("satisfyAngleConstraint", () => {
  it("leaves a straight limb untouched", () => {
    const a = createPoint({ x: 0, y: -10 });
    const b = createPoint({ x: 0, y: 0 });
    const c = createPoint({ x: 0, y: 10 });
    const constraint = createAngleConstraint(a, b, c, 0.3, Math.PI);

    satisfyAngleConstraint(constraint);

    expect(c.pos.x).toBeCloseTo(0);
    expect(c.pos.y).toBeCloseTo(10);
  });

  it("clamps an over-bent joint to the minimum angle, preserving bone length", () => {
    const a = createPoint({ x: 0, y: -10 });
    const b = createPoint({ x: 0, y: 0 });
    // c folded almost back onto the a->b bone: a very small joint angle.
    const c = createPoint({ x: 0.5, y: -9.9 });
    const minAngle = 0.5;
    const constraint = createAngleConstraint(a, b, c, minAngle, Math.PI);
    const restLength = length(sub(c.pos, b.pos));

    satisfyAngleConstraint(constraint);

    expect(jointAngle(a, b, c)).toBeCloseTo(minAngle, 5);
    expect(length(sub(c.pos, b.pos))).toBeCloseTo(restLength);
  });

  it("clamps hyperextension (bending the wrong way past straight)", () => {
    const a = createPoint({ x: 0, y: -10 });
    const b = createPoint({ x: 0, y: 0 });
    // c bent slightly past straight on the forbidden side.
    const c = createPoint({ x: -0.5, y: 9.9 });
    const minAngle = 0.3;
    const constraint = createAngleConstraint(a, b, c, minAngle, Math.PI);

    satisfyAngleConstraint(constraint);

    expect(jointAngle(a, b, c)).toBeCloseTo(minAngle, 5);
  });
});
