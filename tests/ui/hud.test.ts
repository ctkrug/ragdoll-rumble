import { describe, expect, it } from "vitest";
import { COUNTDOWN_SECONDS, createMatchState } from "../../src/duel/round";
import {
  formatScore,
  matchOverTitle,
  matchStatsText,
  phaseMessage,
  queryHudElements,
} from "../../src/ui/hud";

describe("formatScore", () => {
  it("renders 0 wins as all empty pips", () => {
    expect(formatScore(0)).toBe("○ ○");
  });

  it("fills pips left to right as rounds are won", () => {
    expect(formatScore(1)).toBe("● ○");
    expect(formatScore(2)).toBe("● ●");
  });
});

describe("phaseMessage", () => {
  it("counts down whole seconds during countdown", () => {
    const state = createMatchState();
    state.phaseTime = 0;
    expect(phaseMessage(state)).toBe(String(COUNTDOWN_SECONDS));
  });

  it("shows FIGHT! in the last half second of countdown", () => {
    const state = createMatchState();
    state.phaseTime = COUNTDOWN_SECONDS - 0.4;
    expect(phaseMessage(state)).toBe("FIGHT!");
  });

  it("is blank while fighting", () => {
    const state = createMatchState();
    state.phase = "fighting";
    expect(phaseMessage(state)).toBe("");
  });

  it("announces the round winner", () => {
    const state = createMatchState();
    state.phase = "roundOver";
    state.roundWinner = "A";
    expect(phaseMessage(state)).toBe("PLAYER 1 WINS THE ROUND");
  });

  it("announces a draw round", () => {
    const state = createMatchState();
    state.phase = "roundOver";
    state.roundWinner = null;
    expect(phaseMessage(state)).toBe("DRAW");
  });

  it("is blank during matchOver, since the overlay carries the message", () => {
    const state = createMatchState();
    state.phase = "matchOver";
    expect(phaseMessage(state)).toBe("");
  });
});

describe("matchOverTitle", () => {
  it("announces the match winner", () => {
    const state = createMatchState();
    state.matchWinner = "B";
    expect(matchOverTitle(state)).toBe("PLAYER 2 WINS THE MATCH");
  });

  it("is blank with no winner yet", () => {
    const state = createMatchState();
    expect(matchOverTitle(state)).toBe("");
  });
});

describe("matchStatsText", () => {
  it("pluralizes rounds and hits", () => {
    const state = createMatchState();
    state.round = 3;
    state.totalHitsLanded = 5;
    expect(matchStatsText(state)).toBe("3 ROUNDS · 5 HITS LANDED");
  });

  it("keeps rounds and hit singular at one", () => {
    const state = createMatchState();
    state.round = 1;
    state.totalHitsLanded = 1;
    expect(matchStatsText(state)).toBe("1 ROUND · 1 HIT LANDED");
  });

  it("handles zero hits landed", () => {
    const state = createMatchState();
    state.totalHitsLanded = 0;
    expect(matchStatsText(state)).toBe("1 ROUND · 0 HITS LANDED");
  });
});

describe("queryHudElements", () => {
  it("throws a clear, selector-naming error when required markup is missing", () => {
    const emptyRoot = { querySelector: () => null } as unknown as ParentNode;

    expect(() => queryHudElements(emptyRoot)).toThrow("#score-a");
  });
});
