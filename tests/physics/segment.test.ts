import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { resolveSegmentCollision, type Segment } from "../../src/physics/segment";

describe("resolveSegmentCollision", () => {
  it("clamps a point that has fallen through a flat segment back onto it", () => {
    const point = createPoint({ x: 5, y: 20 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: 5, y: 5 });

    expect(point.pos.y).toBeCloseTo(10);
    expect(point.pos.x).toBeCloseTo(5);
  });

  it("leaves a point above the segment untouched", () => {
    const point = createPoint({ x: 5, y: 0 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: 5, y: 0 });

    expect(point.pos).toEqual({ x: 5, y: 0 });
  });

  it("projects onto a tilted segment along its normal, not straight down", () => {
    const point = createPoint({ x: 5, y: 6 });
    const tilted: Segment = { a: { x: 0, y: 0 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, tilted, 0, { x: 5, y: 2 });

    // Closest point on the y=x line to (5, 6) is (5.5, 5.5).
    expect(point.pos.x).toBeCloseTo(5.5);
    expect(point.pos.y).toBeCloseTo(5.5);
  });

  it("clamps to the nearest endpoint past the segment's ends", () => {
    const point = createPoint({ x: -5, y: 20 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: -5, y: 5 });

    expect(point.pos).toEqual({ x: 0, y: 10 });
  });

  it("bleeds tangential velocity by the friction fraction without touching normal velocity", () => {
    const point = createPoint({ x: 5, y: 20 });
    point.prevPos = { x: 3, y: 21 };
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0.2, { x: 3, y: 9 });

    // Tangential (x) velocity was 5 - 3 = 2; 20% bleeds into prevPos.x.
    expect(point.prevPos.x).toBeCloseTo(3.4);
    expect(point.prevPos.y).toBeCloseTo(21);
  });

  it("never moves a pinned point", () => {
    const point = createPoint({ x: 5, y: 20 }, true);
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: 5, y: 5 });

    expect(point.pos).toEqual({ x: 5, y: 20 });
  });

  it("leaves a point that started (and stayed) on the far side of a finite segment alone", () => {
    // A point resting well below a floating platform must be able to pass
    // underneath rather than reading as "penetrating" from any distance and
    // teleporting up onto it (the platform-suck-up bug this guards against).
    const point = createPoint({ x: 5, y: 300 });
    const platform: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, platform, 0, { x: 5, y: 300 });

    expect(point.pos).toEqual({ x: 5, y: 300 });
  });

  it("tolerates a shallow frame-start penetration as still-resting contact", () => {
    // A point can end one frame a few px shy of full convergence under
    // sustained constraint tension; that shallow overlap must keep resolving
    // rather than getting permanently stuck once it first dips below.
    const point = createPoint({ x: 5, y: 30 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: 5, y: 15 });

    expect(point.pos.y).toBeCloseTo(10);
  });

  it("still resolves a deep same-frame crossing (fast fall through a wide floor)", () => {
    const point = createPoint({ x: 5, y: 500 });
    const floor: Segment = { a: { x: 0, y: 10 }, b: { x: 10, y: 10 } };

    resolveSegmentCollision(point, floor, 0, { x: 5, y: -100 });

    expect(point.pos.y).toBeCloseTo(10);
  });
});
