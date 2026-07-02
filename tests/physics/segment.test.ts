import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { resolveSegmentCollision, type Segment } from "../../src/physics/segment";

describe("resolveSegmentCollision", () => {
  it("clamps a point that has fallen through a flat segment back onto it", () => {
    const point = createPoint({ x: 5, y: 20 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0);

    expect(point.pos.y).toBeCloseTo(10);
    expect(point.pos.x).toBeCloseTo(5);
  });

  it("leaves a point above the segment untouched", () => {
    const point = createPoint({ x: 5, y: 0 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0);

    expect(point.pos).toEqual({ x: 5, y: 0 });
  });

  it("projects onto a tilted segment along its normal, not straight down", () => {
    const point = createPoint({ x: 5, y: 6 });
    const tilted: Segment = { a: { x: 0, y: 0 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, tilted, 0);

    // Closest point on the y=x line to (5, 6) is (5.5, 5.5).
    expect(point.pos.x).toBeCloseTo(5.5);
    expect(point.pos.y).toBeCloseTo(5.5);
  });

  it("clamps to the nearest endpoint past the segment's ends", () => {
    const point = createPoint({ x: -5, y: 20 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0);

    expect(point.pos).toEqual({ x: 0, y: 10 });
  });

  it("bleeds tangential velocity by the friction fraction without touching normal velocity", () => {
    const point = createPoint({ x: 5, y: 20 });
    point.prevPos = { x: 3, y: 21 };
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0.2);

    // Tangential (x) velocity was 5 - 3 = 2; 20% bleeds into prevPos.x.
    expect(point.prevPos.x).toBeCloseTo(3.4);
    expect(point.prevPos.y).toBeCloseTo(21);
  });

  it("never moves a pinned point", () => {
    const point = createPoint({ x: 5, y: 20 }, true);
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0);

    expect(point.pos).toEqual({ x: 5, y: 20 });
  });
});
