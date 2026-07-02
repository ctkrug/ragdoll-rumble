import { describe, expect, it } from "vitest";
import type { KeyboardInput } from "../../src/input/keyboard";
import { PLAYER_ONE_CONTROLS, PLAYER_TWO_CONTROLS, resolveActions } from "../../src/duel/controls";

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
