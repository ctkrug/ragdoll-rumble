import { describe, expect, it } from "vitest";
import { createPoint, integratePoint } from "../../src/physics/point";

describe("integratePoint", () => {
  it("falls under gravity", () => {
    const point = createPoint({ x: 0, y: 0 });
    integratePoint(point, { x: 0, y: 10 }, 1, 1);

    expect(point.pos.y).toBeGreaterThan(0);
    expect(point.prevPos).toEqual({ x: 0, y: 0 });
  });

  it("carries velocity forward from the previous displacement", () => {
    const point = createPoint({ x: 0, y: 0 });
    point.prevPos = { x: -2, y: 0 };

    integratePoint(point, { x: 0, y: 0 }, 1, 1);

    expect(point.pos.x).toBeCloseTo(2);
  });

  it("never moves a pinned point", () => {
    const point = createPoint({ x: 5, y: 5 }, true);

    integratePoint(point, { x: 0, y: 10 }, 1, 1);

    expect(point.pos).toEqual({ x: 5, y: 5 });
  });

  it("damping bleeds off velocity over successive steps", () => {
    const point = createPoint({ x: 0, y: 0 });
    point.prevPos = { x: -10, y: 0 };

    integratePoint(point, { x: 0, y: 0 }, 0.5, 1);
    const firstStepDelta = point.pos.x - point.prevPos.x;

    integratePoint(point, { x: 0, y: 0 }, 0.5, 1);
    const secondStepDelta = point.pos.x - point.prevPos.x;

    expect(Math.abs(secondStepDelta)).toBeLessThan(Math.abs(firstStepDelta));
  });
});
