import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import {
  closestPointsBetweenSegments,
  createCapsule,
  resolveCapsuleCollision,
} from "../../src/physics/capsule";
import { length, sub } from "../../src/physics/vec2";

describe("closestPointsBetweenSegments", () => {
  it("finds the midpoints of two parallel overlapping segments", () => {
    const { s, t } = closestPointsBetweenSegments(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 },
      { x: 10, y: 5 },
    );

    // Any point along a parallel segment is equally close; the algorithm
    // pins the first segment's parameter at its start.
    expect(s).toBeCloseTo(0);
    expect(t).toBeCloseTo(0);
  });

  it("finds the nearest endpoints of two perpendicular, non-overlapping segments", () => {
    const { s, t } = closestPointsBetweenSegments(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: -5 },
      { x: 20, y: 5 },
    );

    expect(s).toBeCloseTo(1);
    expect(t).toBeCloseTo(0.5);
  });
});

describe("resolveCapsuleCollision", () => {
  it("pushes two overlapping vertical capsules apart to just touching", () => {
    const a1 = createPoint({ x: 0, y: 0 });
    const a2 = createPoint({ x: 0, y: 10 });
    const b1 = createPoint({ x: 3, y: 0 });
    const b2 = createPoint({ x: 3, y: 10 });
    const capsuleA = createCapsule(a1, a2, 5);
    const capsuleB = createCapsule(b1, b2, 5);

    const collided = resolveCapsuleCollision(capsuleA, capsuleB);

    const dist = length(sub(b1.pos, a1.pos));
    expect(dist).toBeCloseTo(10);
    expect(collided).toBe(true);
  });

  it("leaves capsules further apart than the combined radius untouched and reports no contact", () => {
    const a1 = createPoint({ x: 0, y: 0 });
    const a2 = createPoint({ x: 0, y: 10 });
    const b1 = createPoint({ x: 100, y: 0 });
    const b2 = createPoint({ x: 100, y: 10 });
    const capsuleA = createCapsule(a1, a2, 5);
    const capsuleB = createCapsule(b1, b2, 5);

    const collided = resolveCapsuleCollision(capsuleA, capsuleB);

    expect(a1.pos).toEqual({ x: 0, y: 0 });
    expect(b1.pos).toEqual({ x: 100, y: 0 });
    expect(collided).toBe(false);
  });

  it("reports no contact for capsules exactly touching at their combined radius", () => {
    const p1 = createPoint({ x: 0, y: 0 });
    const p2 = createPoint({ x: 10, y: 0 });
    const circleA = createCapsule(p1, p1, 5);
    const circleB = createCapsule(p2, p2, 5);

    const collided = resolveCapsuleCollision(circleA, circleB);

    expect(collided).toBe(false);
    expect(p1.pos).toEqual({ x: 0, y: 0 });
    expect(p2.pos).toEqual({ x: 10, y: 0 });
  });

  it("resolves overlapping circles (degenerate capsules) symmetrically", () => {
    const p1 = createPoint({ x: 0, y: 0 });
    const p2 = createPoint({ x: 4, y: 0 });
    const circleA = createCapsule(p1, p1, 5);
    const circleB = createCapsule(p2, p2, 5);

    resolveCapsuleCollision(circleA, circleB);

    expect(length(sub(p2.pos, p1.pos))).toBeCloseTo(10);
    expect(p1.pos.x).toBeCloseTo(-3);
    expect(p2.pos.x).toBeCloseTo(7);
  });
});
