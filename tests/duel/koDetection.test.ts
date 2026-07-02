import { describe, expect, it } from "vitest";
import type { Arena } from "../../src/arena/generator";
import { isOffArena, isPinnedFlat } from "../../src/duel/koDetection";
import { createRagdoll } from "../../src/ragdoll/skeleton";

const arena: Arena = {
  width: 1000,
  height: 800,
  seed: 1,
  floor: { a: { x: 0, y: 700 }, b: { x: 1000, y: 700 } },
  platforms: [],
  geometry: [{ a: { x: 0, y: 700 }, b: { x: 1000, y: 700 } }],
};

describe("isOffArena", () => {
  it("is false for a ragdoll well within the arena", () => {
    const ragdoll = createRagdoll(500, 600);
    expect(isOffArena(ragdoll, arena)).toBe(false);
  });

  it("is true once the pelvis is flung past the left edge margin", () => {
    const ragdoll = createRagdoll(500, 600);
    ragdoll.points.pelvis.pos.x = -100;
    expect(isOffArena(ragdoll, arena)).toBe(true);
  });

  it("is true once the pelvis is flung past the right edge margin", () => {
    const ragdoll = createRagdoll(500, 600);
    ragdoll.points.pelvis.pos.x = 1100;
    expect(isOffArena(ragdoll, arena)).toBe(true);
  });

  it("tolerates a small overshoot within the margin", () => {
    const ragdoll = createRagdoll(500, 600);
    ragdoll.points.pelvis.pos.x = -10;
    expect(isOffArena(ragdoll, arena)).toBe(false);
  });

  it("is true once the pelvis falls well past the bottom of the arena", () => {
    const ragdoll = createRagdoll(500, 600);
    ragdoll.points.pelvis.pos.y = 900;
    expect(isOffArena(ragdoll, arena)).toBe(true);
  });
});

describe("isPinnedFlat", () => {
  it("is false for a standing pose", () => {
    const ragdoll = createRagdoll(500, 500);
    expect(isPinnedFlat(ragdoll, arena)).toBe(false);
  });

  it("is true when the torso is horizontal and resting on the floor", () => {
    const ragdoll = createRagdoll(500, 500);
    ragdoll.points.neck.pos = { x: 460, y: 698 };
    ragdoll.points.pelvis.pos = { x: 540, y: 698 };
    expect(isPinnedFlat(ragdoll, arena)).toBe(true);
  });

  it("is false when the torso is horizontal but well above the floor", () => {
    const ragdoll = createRagdoll(500, 500);
    ragdoll.points.neck.pos = { x: 460, y: 300 };
    ragdoll.points.pelvis.pos = { x: 540, y: 300 };
    expect(isPinnedFlat(ragdoll, arena)).toBe(false);
  });

  it("is false when resting near the floor but still upright", () => {
    const ragdoll = createRagdoll(500, 500);
    ragdoll.points.neck.pos = { x: 500, y: 650 };
    ragdoll.points.pelvis.pos = { x: 500, y: 698 };
    expect(isPinnedFlat(ragdoll, arena)).toBe(false);
  });
});
