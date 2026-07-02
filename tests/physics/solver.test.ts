import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { createDistanceConstraint } from "../../src/physics/constraint";
import { step, type World } from "../../src/physics/solver";

describe("step", () => {
  it("clamps falling points to the floor", () => {
    const point = createPoint({ x: 0, y: 0 });
    const world: World = {
      points: [point],
      constraints: [],
      gravity: { x: 0, y: 500 },
      damping: 1,
      floorY: 10,
    };

    for (let i = 0; i < 20; i++) {
      step(world, 1 / 60);
    }

    expect(point.pos.y).toBeCloseTo(10);
  });

  it("keeps a pinned-to-free chain within its constraint length after settling", () => {
    const anchor = createPoint({ x: 0, y: 0 }, true);
    const bob = createPoint({ x: 0, y: 5 });
    const constraint = createDistanceConstraint(anchor, bob);
    const world: World = {
      points: [anchor, bob],
      constraints: [constraint],
      gravity: { x: 0, y: 500 },
      damping: 0.98,
      floorY: 1000,
    };

    for (let i = 0; i < 120; i++) {
      step(world, 1 / 60);
    }

    const dx = bob.pos.x - anchor.pos.x;
    const dy = bob.pos.y - anchor.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    expect(dist).toBeCloseTo(constraint.restLength, 0);
    expect(anchor.pos).toEqual({ x: 0, y: 0 });
  });
});
