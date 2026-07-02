import { describe, expect, it } from "vitest";
import type { KeyboardInput } from "../../src/input/keyboard";
import { createRagdoll } from "../../src/ragdoll/skeleton";
import {
  applyPlayerActions,
  PLAYER_ONE_CONTROLS,
  PLAYER_TWO_CONTROLS,
  resolveActions,
} from "../../src/duel/controls";

function fakeInput(pressed: string[]): KeyboardInput {
  const pending = new Set(pressed);
  return {
    isDown: () => false,
    consumePressed: (code) => {
      const was = pending.has(code);
      pending.delete(code);
      return was;
    },
    dispose: () => {},
  };
}

describe("PLAYER_ONE_CONTROLS / PLAYER_TWO_CONTROLS", () => {
  it("use entirely disjoint keys so one keyboard can serve both players", () => {
    const p1Keys = Object.values(PLAYER_ONE_CONTROLS);
    const p2Keys = Object.values(PLAYER_TWO_CONTROLS);

    for (const key of p1Keys) {
      expect(p2Keys).not.toContain(key);
    }
  });
});

describe("resolveActions", () => {
  it("returns no actions when nothing was pressed", () => {
    const input = fakeInput([]);

    expect(resolveActions(input, PLAYER_ONE_CONTROLS)).toEqual([]);
  });

  it("returns the action for each pressed key in punch/kick/lunge order", () => {
    const input = fakeInput([PLAYER_ONE_CONTROLS.lunge, PLAYER_ONE_CONTROLS.punch]);

    expect(resolveActions(input, PLAYER_ONE_CONTROLS)).toEqual(["punch", "lunge"]);
  });

  it("only resolves actions for the given scheme's keys", () => {
    const input = fakeInput([PLAYER_TWO_CONTROLS.punch]);

    expect(resolveActions(input, PLAYER_ONE_CONTROLS)).toEqual([]);
  });
});

describe("applyPlayerActions", () => {
  it("aims the impulse toward wherever the opponent currently is", () => {
    const left = createRagdoll(0, 0);
    const right = createRagdoll(100, 0);
    const rightHandBefore = { ...left.points.rightHand.pos };

    applyPlayerActions(left, right, fakeInput([PLAYER_ONE_CONTROLS.punch]), PLAYER_ONE_CONTROLS);

    expect(left.points.rightHand.pos.x).toBeGreaterThan(rightHandBefore.x);
  });

  it("flips direction once the opponent ends up on the other side", () => {
    const left = createRagdoll(0, 0);
    const nowOnTheLeft = createRagdoll(-100, 0);
    const leftHandBefore = { ...left.points.leftHand.pos };

    applyPlayerActions(
      left,
      nowOnTheLeft,
      fakeInput([PLAYER_ONE_CONTROLS.punch]),
      PLAYER_ONE_CONTROLS,
    );

    expect(left.points.leftHand.pos.x).toBeLessThan(leftHandBefore.x);
  });

  it("does nothing when no control-scheme key was pressed", () => {
    const ragdoll = createRagdoll(0, 0);
    const opponent = createRagdoll(100, 0);
    const before = JSON.parse(JSON.stringify(ragdoll.points));

    applyPlayerActions(ragdoll, opponent, fakeInput([]), PLAYER_ONE_CONTROLS);

    expect(ragdoll.points).toEqual(before);
  });
});
