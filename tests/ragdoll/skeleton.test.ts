import { describe, expect, it } from "vitest";
import { createRagdoll, ragdollPointList } from "../../src/ragdoll/skeleton";

describe("createRagdoll", () => {
  it("builds a fifteen-point skeleton", () => {
    const ragdoll = createRagdoll(0, 0);

    expect(ragdollPointList(ragdoll)).toHaveLength(15);
  });

  it("centers the neck on the given origin", () => {
    const ragdoll = createRagdoll(100, 200);

    expect(ragdoll.points.neck.pos).toEqual({ x: 100, y: 200 });
  });

  it("scales limb proportions uniformly", () => {
    const base = createRagdoll(0, 0, 1);
    const doubled = createRagdoll(0, 0, 2);

    const baseSpine = base.points.pelvis.pos.y - base.points.neck.pos.y;
    const doubledSpine = doubled.points.pelvis.pos.y - doubled.points.neck.pos.y;

    expect(doubledSpine).toBeCloseTo(baseSpine * 2);
    expect(doubled.headRadius).toBeCloseTo(base.headRadius * 2);
  });

  it("gives every bone a positive rest length", () => {
    const ragdoll = createRagdoll(0, 0);

    for (const bone of ragdoll.bones) {
      expect(bone.restLength).toBeGreaterThan(0);
    }
  });

  it("adds an angle joint for each elbow and knee", () => {
    const ragdoll = createRagdoll(0, 0);

    expect(ragdoll.joints).toHaveLength(4);
  });

  it("includes every rendered limb in the collidable limb list", () => {
    const ragdoll = createRagdoll(0, 0);

    expect(ragdoll.limbs.length).toBeGreaterThanOrEqual(13);
    for (const limb of ragdoll.limbs) {
      expect(limb.radius).toBeGreaterThan(0);
    }
  });
});
