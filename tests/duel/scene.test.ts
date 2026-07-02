import { describe, expect, it } from "vitest";
import { createDuelScene, resolveRagdollCollisions, stepDuel } from "../../src/duel/scene";
import { createRagdoll } from "../../src/ragdoll/skeleton";
import { length, sub } from "../../src/physics/vec2";

describe("createDuelScene", () => {
  it("places two ragdolls apart, sharing one world", () => {
    const scene = createDuelScene(1440, 900, 1);

    expect(scene.ragdollA.points.neck.pos.x).toBeLessThan(scene.ragdollB.points.neck.pos.x);
    expect(scene.world.points.length).toBe(30);
    expect(scene.world.constraints.length).toBe(
      scene.ragdollA.bones.length + scene.ragdollB.bones.length,
    );
  });

  it("scales ragdoll size to the arena height", () => {
    const small = createDuelScene(800, 400, 1);
    const large = createDuelScene(800, 1200, 1);

    expect(large.ragdollA.headRadius).toBeGreaterThan(small.ragdollA.headRadius);
  });

  it("builds the world's geometry from the seeded arena", () => {
    const scene = createDuelScene(1440, 900, 5);

    expect(scene.world.geometry).toBe(scene.arena.geometry);
    expect(scene.world.geometry).toContain(scene.arena.floor);
  });

  it("reproduces the same arena and ragdoll placement for the same seed", () => {
    const a = createDuelScene(1440, 900, 123);
    const b = createDuelScene(1440, 900, 123);

    expect(b.arena).toEqual(a.arena);
    expect(b.ragdollA.points.neck.pos).toEqual(a.ragdollA.points.neck.pos);
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
    const scene = createDuelScene(1440, 900, 2);

    for (let i = 0; i < 60; i++) {
      stepDuel(scene, 1 / 60);
    }

    for (const point of scene.world.points) {
      expect(Number.isFinite(point.pos.x)).toBe(true);
      expect(Number.isFinite(point.pos.y)).toBe(true);
    }
  });
});
