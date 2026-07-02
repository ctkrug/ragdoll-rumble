import { describe, expect, it } from "vitest";
import {
  createFlashState,
  flashVisual,
  triggerFlash,
  updateFlash,
} from "../../src/render/impactFlash";

describe("createFlashState", () => {
  it("starts idle", () => {
    expect(createFlashState()).toEqual({ timeRemaining: 0, position: { x: 0, y: 0 } });
  });
});

describe("triggerFlash", () => {
  it("sets a positive time remaining and the requested position", () => {
    const state = createFlashState();

    triggerFlash(state, { x: 12, y: 34 });

    expect(state.timeRemaining).toBeGreaterThan(0);
    expect(state.position).toEqual({ x: 12, y: 34 });
  });

  it("restarts an in-progress flash at the new position rather than stacking it", () => {
    const state = createFlashState();
    triggerFlash(state, { x: 1, y: 1 });
    updateFlash(state, 0.05);

    triggerFlash(state, { x: 9, y: 9 });

    expect(state.position).toEqual({ x: 9, y: 9 });
    expect(state.timeRemaining).toBeGreaterThan(0.05);
  });
});

describe("updateFlash", () => {
  it("counts time remaining down and floors at zero", () => {
    const state = createFlashState();
    triggerFlash(state, { x: 0, y: 0 });

    updateFlash(state, 1);

    expect(state.timeRemaining).toBe(0);
  });
});

describe("flashVisual", () => {
  it("is fully transparent while idle", () => {
    const state = createFlashState();

    expect(flashVisual(state)).toEqual({ opacity: 0, radius: 0 });
  });

  it("starts near-opaque and small right after triggering", () => {
    const state = createFlashState();
    triggerFlash(state, { x: 0, y: 0 });

    const { opacity, radius } = flashVisual(state);

    expect(opacity).toBeGreaterThan(0.9);
    expect(radius).toBeLessThan(5);
  });

  it("fades out and grows as time runs out", () => {
    const state = createFlashState();
    triggerFlash(state, { x: 0, y: 0 });
    updateFlash(state, 0.09);

    const { opacity, radius } = flashVisual(state);

    expect(opacity).toBeLessThan(0.2);
    expect(radius).toBeGreaterThan(20);
  });
});
