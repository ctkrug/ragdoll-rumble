import type { KeyboardInput } from "../input/keyboard";
import { applyImpulse, type ImpulseAction } from "./impulse";
import type { Ragdoll } from "../ragdoll/skeleton";

export interface ControlScheme {
  punch: string;
  kick: string;
  lunge: string;
}

/** Left-hand letter cluster, disjoint from Player Two's right-hand punctuation cluster. */
export const PLAYER_ONE_CONTROLS: ControlScheme = {
  punch: "KeyF",
  kick: "KeyG",
  lunge: "KeyH",
};

/** Right-hand punctuation cluster, disjoint from Player One's letter cluster. */
export const PLAYER_TWO_CONTROLS: ControlScheme = {
  punch: "Slash",
  kick: "Period",
  lunge: "Comma",
};

/** Every action edge-triggered since the last poll, in punch/kick/lunge priority order. */
export function resolveActions(input: KeyboardInput, scheme: ControlScheme): ImpulseAction[] {
  const actions: ImpulseAction[] = [];
  if (input.consumePressed(scheme.punch)) actions.push("punch");
  if (input.consumePressed(scheme.kick)) actions.push("kick");
  if (input.consumePressed(scheme.lunge)) actions.push("lunge");
  return actions;
}

/**
 * Polls one player's scheme and applies any resulting impulses to their
 * ragdoll, aimed toward wherever the opponent currently is (recomputed every
 * call rather than fixed at spawn, since either ragdoll can end up on either
 * side after a hit).
 */
export function applyPlayerActions(
  ragdoll: Ragdoll,
  opponent: Ragdoll,
  input: KeyboardInput,
  scheme: ControlScheme,
): void {
  const direction: 1 | -1 = opponent.points.pelvis.pos.x >= ragdoll.points.pelvis.pos.x ? 1 : -1;
  for (const action of resolveActions(input, scheme)) {
    applyImpulse(ragdoll, action, direction);
  }
}
