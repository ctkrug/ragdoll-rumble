import { applyImpulse, type ImpulseAction } from "../duel/impulse";
import { facingDirection } from "../duel/controls";
import type { DuelScene } from "../duel/scene";
import type { RoundPhase } from "../duel/round";

const IMPULSE_ACTIONS: ImpulseAction[] = ["punch", "kick", "lunge"];

export type TouchPlayer = "A" | "B";

export interface TouchButtonTarget {
  player: TouchPlayer;
  action: ImpulseAction;
}

/**
 * Reads a touch button's `data-player`/`data-action` attributes into a typed
 * target, or null if either is missing/unrecognized (a markup bug shouldn't
 * throw at click time).
 */
export function parseTouchButton(
  player: string | undefined,
  action: string | undefined,
): TouchButtonTarget | null {
  if (player !== "1" && player !== "2") return null;
  if (!action || !IMPULSE_ACTIONS.includes(action as ImpulseAction)) return null;

  return { player: player === "1" ? "A" : "B", action: action as ImpulseAction };
}

/**
 * Wires every `[data-player][data-action]` button under `root` to apply a
 * combat impulse to the matching ragdoll, aimed at the current opponent.
 * Taps outside `"fighting"` are ignored — the countdown/round-over/match-over
 * phases already gate keyboard input the same way (see main.ts), and a
 * dedicated Rematch button covers the matchOver case touch would otherwise
 * need a separate gesture for. Returns a disposer that removes all the
 * listeners it added.
 */
export function wireTouchControls(
  root: ParentNode,
  getScene: () => DuelScene,
  getPhase: () => RoundPhase,
): () => void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>("[data-player][data-action]"));
  const disposers: Array<() => void> = [];

  for (const button of buttons) {
    const target = parseTouchButton(button.dataset.player, button.dataset.action);
    if (!target) continue;

    const handler = (event: Event): void => {
      event.preventDefault();
      if (getPhase() !== "fighting") return;
      const scene = getScene();
      const ragdoll = target.player === "A" ? scene.ragdollA : scene.ragdollB;
      const opponent = target.player === "A" ? scene.ragdollB : scene.ragdollA;
      applyImpulse(ragdoll, target.action, facingDirection(ragdoll, opponent));
    };

    button.addEventListener("pointerdown", handler);
    disposers.push(() => button.removeEventListener("pointerdown", handler));
  }

  return () => disposers.forEach((dispose) => dispose());
}
