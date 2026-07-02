import { describe, expect, it } from "vitest";
import {
  advanceMatch,
  COUNTDOWN_SECONDS,
  createMatchState,
  PIN_THRESHOLD_SECONDS,
  recordLandedHit,
  ROUND_OVER_SECONDS,
  ROUNDS_TO_WIN,
  type KoStatus,
  type MatchState,
} from "../../src/duel/round";

const NO_KO: KoStatus = { offArenaA: false, offArenaB: false, downA: false, downB: false };

function toFighting(state: MatchState): void {
  advanceMatch(state, NO_KO, COUNTDOWN_SECONDS);
}

describe("createMatchState", () => {
  it("starts a fresh match in countdown at round 1 with no score", () => {
    const state = createMatchState();

    expect(state).toEqual({
      phase: "countdown",
      phaseTime: 0,
      round: 1,
      scoreA: 0,
      scoreB: 0,
      pinTimerA: 0,
      pinTimerB: 0,
      roundWinner: null,
      matchWinner: null,
      totalHitsLanded: 0,
    });
  });
});

describe("recordLandedHit", () => {
  it("increments totalHitsLanded and leaves the rest of the state untouched", () => {
    const state = createMatchState();

    recordLandedHit(state);
    recordLandedHit(state);

    expect(state.totalHitsLanded).toBe(2);
    expect(state.phase).toBe("countdown");
  });
});

describe("advanceMatch during countdown", () => {
  it("stays in countdown before the timer elapses", () => {
    const state = createMatchState();

    advanceMatch(state, NO_KO, COUNTDOWN_SECONDS - 0.5);

    expect(state.phase).toBe("countdown");
  });

  it("moves to fighting once the timer elapses, resetting phaseTime", () => {
    const state = createMatchState();

    advanceMatch(state, NO_KO, COUNTDOWN_SECONDS);

    expect(state.phase).toBe("fighting");
    expect(state.phaseTime).toBe(0);
  });
});

describe("advanceMatch during fighting", () => {
  it("stays fighting with no KO condition met", () => {
    const state = createMatchState();
    toFighting(state);

    advanceMatch(state, NO_KO, 1);

    expect(state.phase).toBe("fighting");
    expect(state.pinTimerA).toBe(0);
  });

  it("ends the round immediately on an off-arena KO", () => {
    const state = createMatchState();
    toFighting(state);

    advanceMatch(state, { ...NO_KO, offArenaA: true }, 1 / 60);

    expect(state.phase).toBe("roundOver");
    expect(state.roundWinner).toBe("B");
    expect(state.scoreB).toBe(1);
    expect(state.scoreA).toBe(0);
  });

  it("accumulates the pin timer across frames while a player stays down", () => {
    const state = createMatchState();
    toFighting(state);

    advanceMatch(state, { ...NO_KO, downA: true }, PIN_THRESHOLD_SECONDS * 0.6);
    expect(state.phase).toBe("fighting");
    expect(state.pinTimerA).toBeCloseTo(PIN_THRESHOLD_SECONDS * 0.6);

    advanceMatch(state, { ...NO_KO, downA: true }, PIN_THRESHOLD_SECONDS * 0.6);

    expect(state.phase).toBe("roundOver");
    expect(state.roundWinner).toBe("B");
    expect(state.scoreB).toBe(1);
  });

  it("resets the pin timer the moment a player gets back up", () => {
    const state = createMatchState();
    toFighting(state);

    advanceMatch(state, { ...NO_KO, downA: true }, PIN_THRESHOLD_SECONDS * 0.9);
    advanceMatch(state, { ...NO_KO, downA: false }, 1 / 60);

    expect(state.pinTimerA).toBe(0);
    expect(state.phase).toBe("fighting");
  });

  it("calls a simultaneous KO a draw with no score change", () => {
    const state = createMatchState();
    toFighting(state);

    advanceMatch(state, { ...NO_KO, offArenaA: true, offArenaB: true }, 1 / 60);

    expect(state.phase).toBe("roundOver");
    expect(state.roundWinner).toBeNull();
    expect(state.scoreA).toBe(0);
    expect(state.scoreB).toBe(0);
  });
});

describe("advanceMatch during roundOver", () => {
  function toRoundOver(state: MatchState): void {
    toFighting(state);
    advanceMatch(state, { ...NO_KO, offArenaA: true }, 1 / 60);
  }

  it("stays in roundOver before its timer elapses", () => {
    const state = createMatchState();
    toRoundOver(state);

    advanceMatch(state, NO_KO, ROUND_OVER_SECONDS - 0.5);

    expect(state.phase).toBe("roundOver");
  });

  it("advances to the next round's countdown when no one has won the match", () => {
    const state = createMatchState();
    toRoundOver(state);

    advanceMatch(state, NO_KO, ROUND_OVER_SECONDS);

    expect(state.phase).toBe("countdown");
    expect(state.round).toBe(2);
    expect(state.phaseTime).toBe(0);
  });

  it("ends the match once a player reaches ROUNDS_TO_WIN", () => {
    const state = createMatchState();
    for (let round = 0; round < ROUNDS_TO_WIN; round++) {
      toRoundOver(state);
      advanceMatch(state, NO_KO, ROUND_OVER_SECONDS);
    }

    expect(state.phase).toBe("matchOver");
    expect(state.matchWinner).toBe("B");
    expect(state.scoreB).toBe(ROUNDS_TO_WIN);
  });
});

describe("advanceMatch during matchOver", () => {
  it("stays in matchOver regardless of KO status", () => {
    const state = createMatchState();
    state.phase = "matchOver";
    state.matchWinner = "A";

    advanceMatch(state, { ...NO_KO, offArenaB: true }, 1);

    expect(state.phase).toBe("matchOver");
    expect(state.matchWinner).toBe("A");
  });
});
