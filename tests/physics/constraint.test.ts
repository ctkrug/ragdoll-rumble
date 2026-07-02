import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { createDistanceConstraint, satisfyDistanceConstraint } from "../../src/physics/constraint";
import { length, sub } from "../../src/physics/vec2";

describe("createDistanceConstraint", () => {
  it("captures the current separation as restLength", () => {
    const a = createPoint({ x: 0, y: 0 });
    const b = createPoint({ x: 3, y: 4 });

    const constraint = createDistanceConstraint(a, b);

    expect(constraint.restLength).toBeCloseTo(5);
  });
});

describe("satisfyDistanceConstraint", () => {
  it("pulls two free points toward restLength symmetrically", () => {
    const a = createPoint({ x: 0, y: 0 });
    const b = createPoint({ x: 10, y: 0 });
    const constraint = createDistanceConstraint(a, b);
    constraint.restLength = 4;

    satisfyDistanceConstraint(constraint);

    expect(length(sub(b.pos, a.pos))).toBeCloseTo(4);
    expect(a.pos.x).toBeCloseTo(3);
    expect(b.pos.x).toBeCloseTo(7);
  });

  it("only moves the free point when the other endpoint is pinned", () => {
    const a = createPoint({ x: 0, y: 0 }, true);
    const b = createPoint({ x: 10, y: 0 });
    const constraint = createDistanceConstraint(a, b);
    constraint.restLength = 4;

    satisfyDistanceConstraint(constraint);

    expect(a.pos).toEqual({ x: 0, y: 0 });
    expect(length(sub(b.pos, a.pos))).toBeCloseTo(4);
  });

  it("leaves both points untouched when a and b are coincident", () => {
    const a = createPoint({ x: 1, y: 1 });
    const b = createPoint({ x: 1, y: 1 });
    const constraint = createDistanceConstraint(a, b);
    constraint.restLength = 4;

    satisfyDistanceConstraint(constraint);

    expect(a.pos).toEqual({ x: 1, y: 1 });
    expect(b.pos).toEqual({ x: 1, y: 1 });
  });

  it("scales the correction by stiffness", () => {
    const a = createPoint({ x: 0, y: 0 });
    const b = createPoint({ x: 10, y: 0 });
    const constraint = createDistanceConstraint(a, b, 0.5);
    constraint.restLength = 4;

    satisfyDistanceConstraint(constraint);

    // Full correction would close the gap to 4; half stiffness closes it halfway.
    expect(length(sub(b.pos, a.pos))).toBeCloseTo(7);
  });
});
