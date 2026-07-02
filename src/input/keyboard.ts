/** The subset of EventTarget the tracker needs, so tests can pass a fake. */
export interface KeyEventTarget {
  addEventListener(type: "keydown" | "keyup", listener: (event: { code: string }) => void): void;
  removeEventListener(type: "keydown" | "keyup", listener: (event: { code: string }) => void): void;
}

export interface KeyboardInput {
  /** True while the key is physically held down. */
  isDown(code: string): boolean;
  /**
   * True once per press, edge-triggered: the first poll after the key goes
   * down returns true and clears the flag, so a held key fires an action
   * (punch/kick/lunge) once rather than every frame it's held.
   */
  consumePressed(code: string): boolean;
  dispose(): void;
}

/**
 * Tracks keyboard state for gameplay input. Held-key state (`isDown`) and a
 * separate "pressed since last poll" set (`consumePressed`) are both needed:
 * movement-style input wants the former, one-shot actions want the latter.
 */
export function createKeyboardInput(target: KeyEventTarget): KeyboardInput {
  const down = new Set<string>();
  const pressedSinceLastPoll = new Set<string>();

  const onKeyDown = (event: { code: string }): void => {
    if (!down.has(event.code)) pressedSinceLastPoll.add(event.code);
    down.add(event.code);
  };
  const onKeyUp = (event: { code: string }): void => {
    down.delete(event.code);
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);

  return {
    isDown: (code) => down.has(code),
    consumePressed: (code) => {
      const wasPressed = pressedSinceLastPoll.has(code);
      pressedSinceLastPoll.delete(code);
      return wasPressed;
    },
    dispose: () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
    },
  };
}
