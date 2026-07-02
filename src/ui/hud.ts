import { COUNTDOWN_SECONDS, ROUNDS_TO_WIN, type MatchState, type Player } from "../duel/round";

export interface HudElements {
  scoreA: HTMLElement;
  scoreB: HTMLElement;
  roundLabel: HTMLElement;
  phaseMessage: HTMLElement;
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayStats: HTMLElement;
  overlayParticles: HTMLElement;
  rematchButton: HTMLButtonElement;
  muteToggle: HTMLButtonElement;
}

/** How many pixel-square particles the win celebration bursts outward. */
const PARTICLE_COUNT = 16;

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

/** The match-over overlay's stats line: how long the fight ran, how it landed. */
export function matchStatsText(state: MatchState): string {
  const rounds = `${state.round} ROUND${state.round === 1 ? "" : "S"}`;
  const hits = `${state.totalHitsLanded} HIT${state.totalHitsLanded === 1 ? "" : "S"} LANDED`;
  return `${rounds} · ${hits}`;
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
    overlayStats: get("#match-overlay-stats"),
    overlayParticles: get("#match-overlay-particles"),
    rematchButton: get<HTMLButtonElement>("#rematch-button"),
    muteToggle: get<HTMLButtonElement>("#mute-toggle"),
  };
}

/**
 * Bursts a ring of pixel-square particles from the overlay card's center,
 * themed to the match winner's color. One-shot: call exactly once on the
 * transition into "matchOver" (main.ts tracks the phase change), not every
 * frame — each call clears and replaces the previous burst.
 */
export function triggerWinCelebration(elements: HudElements, state: MatchState): void {
  elements.overlayParticles.replaceChildren();
  if (!state.matchWinner) return;

  const themeClass = state.matchWinner === "A" ? "particle--p1" : "particle--p2";
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement("span");
    particle.className = `particle ${themeClass}`;
    const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
    const distance = 80 + Math.random() * 60;
    particle.style.setProperty("--particle-dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--particle-dy", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-delay", `${Math.random() * 80}ms`);
    elements.overlayParticles.appendChild(particle);
  }
}

/** Syncs the mute button's label and a11y state; called whenever mute is toggled, not every frame. */
export function renderMuteToggle(button: HTMLButtonElement, muted: boolean): void {
  button.textContent = muted ? "Sound: Off" : "Sound: On";
  button.setAttribute("aria-pressed", String(muted));
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
  elements.overlayStats.textContent = showOverlay ? matchStatsText(state) : "";
}
