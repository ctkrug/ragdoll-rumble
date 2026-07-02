import type { KeyboardInput } from "../input/keyboard";
import type { ImpulseAction } from "./impulse";

export interface ControlScheme {
  punch: string;
  kick: string;
  lunge: string;
}

/** Left-hand-side keys, well clear of Player Two's arrow/navigation cluster. */
export const PLAYER_ONE_CONTROLS: ControlScheme = {
  punch: "KeyF",
  kick: "KeyG",
  lunge: "KeyH",
};

/** Right-hand-side keys, clear of Player One's cluster. */
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
