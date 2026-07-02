import { describe, expect, it } from "vitest";
import { createPoint } from "../../src/physics/point";
import { createRagdoll } from "../../src/ragdoll/skeleton";
import { applyImpulse, applyPointImpulse } from "../../src/duel/impulse";

describe("applyPointImpulse", () => {
  it("nudges pos without touching prevPos, so it reads as an instant velocity kick", () => {
    const point = createPoint({ x: 0, y: 0 });

    applyPointImpulse(point, { x: 10, y: -2 }, 1);

    expect(point.pos).toEqual({ x: 10, y: -2 });
    expect(point.prevPos).toEqual({ x: 0, y: 0 });
  });

  it("flips the x component by direction", () => {
    const point = createPoint({ x: 0, y: 0 });

    applyPointImpulse(point, { x: 10, y: -2 }, -1);

    expect(point.pos).toEqual({ x: -10, y: -2 });
  });

  it("does nothing to a pinned point", () => {
    const point = createPoint({ x: 5, y: 5 }, true);

    applyPointImpulse(point, { x: 10, y: -2 }, 1);

    expect(point.pos).toEqual({ x: 5, y: 5 });
  });
});

describe("applyImpulse", () => {
  it("punches with the hand facing the opponent and leaves the other hand still", () => {
    const ragdoll = createRagdoll(0, 0);
    const rightHandBefore = { ...ragdoll.points.rightHand.pos };
    const leftHandBefore = { ...ragdoll.points.leftHand.pos };

    applyImpulse(ragdoll, "punch", 1);

    expect(ragdoll.points.rightHand.pos.x).toBeGreaterThan(rightHandBefore.x);
    expect(ragdoll.points.leftHand.pos).toEqual(leftHandBefore);
  });

  it("punches with the left hand when facing left", () => {
    const ragdoll = createRagdoll(0, 0);
    const leftHandBefore = { ...ragdoll.points.leftHand.pos };

    applyImpulse(ragdoll, "punch", -1);

    expect(ragdoll.points.leftHand.pos.x).toBeLessThan(leftHandBefore.x);
  });

  it("kicks with the foot facing the opponent", () => {
    const ragdoll = createRagdoll(0, 0);
    const rightFootBefore = { ...ragdoll.points.rightFoot.pos };

    applyImpulse(ragdoll, "kick", 1);

    expect(ragdoll.points.rightFoot.pos.x).toBeGreaterThan(rightFootBefore.x);
  });

  it("lunges by nudging the pelvis toward the opponent", () => {
    const ragdoll = createRagdoll(0, 0);
    const pelvisBefore = { ...ragdoll.points.pelvis.pos };

    applyImpulse(ragdoll, "lunge", 1);

    expect(ragdoll.points.pelvis.pos.x).toBeGreaterThan(pelvisBefore.x);
  });
});
