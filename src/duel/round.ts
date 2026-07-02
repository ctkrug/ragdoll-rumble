export type RoundPhase = "countdown" | "fighting" | "roundOver" | "matchOver";
export type Player = "A" | "B";

export interface KoStatus {
  offArenaA: boolean;
  offArenaB: boolean;
  downA: boolean;
  downB: boolean;
}

export interface MatchState {
  phase: RoundPhase;
  /** Seconds elapsed since `phase` last changed. */
  phaseTime: number;
  round: number;
  scoreA: number;
  scoreB: number;
  /** Seconds each ragdoll has been continuously pinned this round. */
  pinTimerA: number;
  pinTimerB: number;
  roundWinner: Player | null;
  matchWinner: Player | null;
  /** How many swings have landed a genuine hit this match; a fun stat for the win overlay. */
  totalHitsLanded: number;
}

export const COUNTDOWN_SECONDS = 3;
export const ROUND_OVER_SECONDS = 2.5;
export const PIN_THRESHOLD_SECONDS = 1.1;
export const ROUNDS_TO_WIN = 2;
/** Ignore rematch input for this long into matchOver, so the keypress that landed the final KO isn't also read as the rematch request. */
export const MATCH_OVER_INPUT_DELAY_SECONDS = 1;

export function createMatchState(): MatchState {
  return {
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
  };
}

/** Records a genuine landed hit (main.ts calls this alongside its shake/flash/SFX trigger). */
export function recordLandedHit(state: MatchState): void {
  state.totalHitsLanded++;
}

/**
 * Advances one fixed physics tick's worth of match bookkeeping: countdown and
 * round-over timers, the pin-on-back accumulators, and phase transitions.
 * Mutates `state` in place, mirroring `solver.step`. Doesn't touch the
 * DuelScene itself — the caller decides when to rebuild one in response to a
 * phase change (see main.ts).
 */
export function advanceMatch(state: MatchState, ko: KoStatus, dt: number): void {
  state.phaseTime += dt;

  switch (state.phase) {
    case "countdown":
      if (state.phaseTime >= COUNTDOWN_SECONDS) {
        state.phase = "fighting";
        state.phaseTime = 0;
      }
      return;

    case "fighting": {
      state.pinTimerA = ko.downA ? state.pinTimerA + dt : 0;
      state.pinTimerB = ko.downB ? state.pinTimerB + dt : 0;

      const koA = ko.offArenaA || state.pinTimerA >= PIN_THRESHOLD_SECONDS;
      const koB = ko.offArenaB || state.pinTimerB >= PIN_THRESHOLD_SECONDS;
      if (!koA && !koB) return;

      // A simultaneous KO is a draw: the round still ends, but neither
      // player's score moves.
      state.roundWinner = koA === koB ? null : koA ? "B" : "A";
      if (state.roundWinner === "A") state.scoreA++;
      if (state.roundWinner === "B") state.scoreB++;
      state.phase = "roundOver";
      state.phaseTime = 0;
      return;
    }

    case "roundOver":
      if (state.phaseTime < ROUND_OVER_SECONDS) return;

      state.pinTimerA = 0;
      state.pinTimerB = 0;
      if (state.scoreA >= ROUNDS_TO_WIN || state.scoreB >= ROUNDS_TO_WIN) {
        state.matchWinner = state.scoreA > state.scoreB ? "A" : "B";
        state.phase = "matchOver";
      } else {
        state.round++;
        state.phase = "countdown";
      }
      state.phaseTime = 0;
      return;

    case "matchOver":
      return;
  }
}
