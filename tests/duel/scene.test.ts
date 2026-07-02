import { describe, expect, it } from "vitest";
import { createDuelScene, resolveRagdollCollisions, stepDuel } from "../../src/duel/scene";
import { createRagdoll } from "../../src/ragdoll/skeleton";
import { length, sub } from "../../src/physics/vec2";

describe("createDuelScene", () => {
  it("places two ragdolls apart, sharing one world", () => {
    const scene = createDuelScene(1440, 900);

    expect(scene.ragdollA.points.neck.pos.x).toBeLessThan(scene.ragdollB.points.neck.pos.x);
    expect(scene.world.points.length).toBe(30);
    expect(scene.world.constraints.length).toBe(
      scene.ragdollA.bones.length + scene.ragdollB.bones.length,
    );
  });

  it("scales ragdoll size to the arena height", () => {
    const small = createDuelScene(800, 400);
    const large = createDuelScene(800, 1200);

    expect(large.ragdollA.headRadius).toBeGreaterThan(small.ragdollA.headRadius);
  });
});

describe("resolveRagdollCollisions", () => {
  it("separates two overlapping torsos", () => {
    const a = createRagdoll(0, 0);
    const b = createRagdoll(5, 0);
    const before = length(sub(b.points.neck.pos, a.points.neck.pos));

    resolveRagdollCollisions(a, b);

    const after = length(sub(b.points.neck.pos, a.points.neck.pos));
    expect(after).toBeGreaterThan(before);
  });
});

describe("stepDuel", () => {
  it("runs a full duel step without producing NaNs", () => {
    const scene = createDuelScene(1440, 900);

    for (let i = 0; i < 60; i++) {
      stepDuel(scene, 1 / 60);
    }

    for (const point of scene.world.points) {
      expect(Number.isFinite(point.pos.x)).toBe(true);
      expect(Number.isFinite(point.pos.y)).toBe(true);
    }
  });
});
