import { COUNTDOWN_SECONDS, ROUNDS_TO_WIN, type MatchState, type Player } from "../duel/round";

export interface HudElements {
  scoreA: HTMLElement;
  scoreB: HTMLElement;
  roundLabel: HTMLElement;
  phaseMessage: HTMLElement;
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  rematchButton: HTMLButtonElement;
}

function playerNumber(player: Player): 1 | 2 {
  return player === "A" ? 1 : 2;
}

/** A filled/empty pip readout for a score out of ROUNDS_TO_WIN, e.g. "● ○". */
export function formatScore(score: number): string {
  return Array.from({ length: ROUNDS_TO_WIN }, (_, i) => (i < score ? "●" : "○")).join(" ");
}

/** The countdown/status line shown between the two score panels. */
export function phaseMessage(state: MatchState): string {
  switch (state.phase) {
    case "countdown": {
      const remaining = COUNTDOWN_SECONDS - state.phaseTime;
      return remaining <= 0.5 ? "FIGHT!" : String(Math.ceil(remaining));
    }
    case "fighting":
      return "";
    case "roundOver":
      return state.roundWinner
        ? `PLAYER ${playerNumber(state.roundWinner)} WINS THE ROUND`
        : "DRAW";
    case "matchOver":
      return "";
  }
}

/** The match-over overlay's headline; blank until a match winner is set. */
export function matchOverTitle(state: MatchState): string {
  return state.matchWinner ? `PLAYER ${playerNumber(state.matchWinner)} WINS THE MATCH` : "";
}

/** Looks up the HUD's DOM elements once at startup; throws on missing markup rather than failing silently at render time. */
export function queryHudElements(root: ParentNode): HudElements {
  function get<T extends Element>(selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`HUD element not found: ${selector}`);
    return element;
  }

  return {
    scoreA: get("#score-a"),
    scoreB: get("#score-b"),
    roundLabel: get("#round-label"),
    phaseMessage: get("#phase-message"),
    overlay: get("#match-overlay"),
    overlayTitle: get("#match-overlay-title"),
    rematchButton: get<HTMLButtonElement>("#rematch-button"),
  };
}

/** Syncs the HUD's DOM to the current match state; cheap enough to call once per rendered frame. */
export function renderHud(elements: HudElements, state: MatchState): void {
  elements.scoreA.textContent = formatScore(state.scoreA);
  elements.scoreB.textContent = formatScore(state.scoreB);
  elements.roundLabel.textContent = `ROUND ${state.round}`;
  elements.phaseMessage.textContent = phaseMessage(state);

  const showOverlay = state.phase === "matchOver";
  elements.overlay.hidden = !showOverlay;
  elements.overlayTitle.textContent = showOverlay ? matchOverTitle(state) : "";
}
