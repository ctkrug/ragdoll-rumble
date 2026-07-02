import { describe, expect, it } from "vitest";
import { createRagdoll, ragdollPointList } from "../../src/ragdoll/skeleton";
import { step, type World } from "../../src/physics/solver";

function jointAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: {
    x: number;
    y: number;
  },
): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  return Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y);
}

describe("ragdoll settling under gravity", () => {
  it("falls to the floor without exploding or producing NaNs", () => {
    const ragdoll = createRagdoll(200, 0);
    const world: World = {
      points: ragdollPointList(ragdoll),
      constraints: ragdoll.bones,
      angleConstraints: ragdoll.joints,
      gravity: { x: 0, y: 900 },
      damping: 0.98,
      floorY: 500,
    };

    for (let i = 0; i < 300; i++) {
      step(world, 1 / 60);
    }

    for (const point of world.points) {
      expect(Number.isFinite(point.pos.x)).toBe(true);
      expect(Number.isFinite(point.pos.y)).toBe(true);
      expect(point.pos.y).toBeLessThanOrEqual(500 + 1e-6);
    }
  });

  it("keeps elbows and knees within their joint limits once settled", () => {
    const ragdoll = createRagdoll(200, 0);
    const world: World = {
      points: ragdollPointList(ragdoll),
      constraints: ragdoll.bones,
      angleConstraints: ragdoll.joints,
      gravity: { x: 0, y: 900 },
      damping: 0.98,
      floorY: 500,
    };

    for (let i = 0; i < 300; i++) {
      step(world, 1 / 60);
    }

    for (const joint of ragdoll.joints) {
      const angle = jointAngle(joint.a.pos, joint.b.pos, joint.c.pos);
      expect(angle).toBeGreaterThanOrEqual(joint.minAngle - 1e-6);
    }
  });
});
