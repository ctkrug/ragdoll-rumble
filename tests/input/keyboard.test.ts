import { describe, expect, it } from "vitest";
import { createKeyboardInput, type KeyEventTarget } from "../../src/input/keyboard";

type Listener = (event: { code: string }) => void;

/** A minimal fake target so tests don't need a real DOM/window. */
function createFakeTarget(): KeyEventTarget & {
  fireKeyDown: (code: string) => void;
  fireKeyUp: (code: string) => void;
} {
  const listeners: Record<"keydown" | "keyup", Listener[]> = { keydown: [], keyup: [] };

  return {
    addEventListener: (type, listener) => listeners[type].push(listener),
    removeEventListener: (type, listener) => {
      listeners[type] = listeners[type].filter((l) => l !== listener);
    },
    fireKeyDown: (code) => listeners.keydown.forEach((l) => l({ code })),
    fireKeyUp: (code) => listeners.keyup.forEach((l) => l({ code })),
  };
}

describe("createKeyboardInput", () => {
  it("reports a key as down after keydown and not after keyup", () => {
    const target = createFakeTarget();
    const input = createKeyboardInput(target);

    expect(input.isDown("KeyA")).toBe(false);
    target.fireKeyDown("KeyA");
    expect(input.isDown("KeyA")).toBe(true);
    target.fireKeyUp("KeyA");
    expect(input.isDown("KeyA")).toBe(false);
  });

  it("consumePressed fires once per press even if the key is held across polls", () => {
    const target = createFakeTarget();
    const input = createKeyboardInput(target);

    target.fireKeyDown("KeyF");
    expect(input.consumePressed("KeyF")).toBe(true);
    expect(input.consumePressed("KeyF")).toBe(false);
    expect(input.consumePressed("KeyF")).toBe(false);
  });

  it("consumePressed fires again after a release and re-press", () => {
    const target = createFakeTarget();
    const input = createKeyboardInput(target);

    target.fireKeyDown("KeyF");
    input.consumePressed("KeyF");
    target.fireKeyUp("KeyF");
    target.fireKeyDown("KeyF");

    expect(input.consumePressed("KeyF")).toBe(true);
  });

  it("stops updating state after dispose", () => {
    const target = createFakeTarget();
    const input = createKeyboardInput(target);

    input.dispose();
    target.fireKeyDown("KeyA");

    expect(input.isDown("KeyA")).toBe(false);
  });
});
