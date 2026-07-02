import { describe, expect, it } from "vitest";
import {
  createShakeState,
  shakeOffset,
  triggerShake,
  updateShake,
} from "../../src/render/screenShake";

describe("createShakeState", () => {
  it("starts idle", () => {
    expect(createShakeState()).toEqual({ timeRemaining: 0, amplitude: 0 });
  });
});

describe("triggerShake", () => {
  it("sets a positive time remaining and the requested amplitude", () => {
    const state = createShakeState();

    triggerShake(state, 4);

    expect(state.timeRemaining).toBeGreaterThan(0);
    expect(state.amplitude).toBe(4);
  });

  it("clamps amplitude to the design token's 6px ceiling", () => {
    const state = createShakeState();

    triggerShake(state, 100);

    expect(state.amplitude).toBe(6);
  });

  it("restarts an in-progress shake rather than stacking it", () => {
    const state = createShakeState();
    triggerShake(state, 2);
    updateShake(state, 0.1);

    triggerShake(state, 5);

    expect(state.amplitude).toBe(5);
    expect(state.timeRemaining).toBeGreaterThan(0.1);
  });
});

describe("updateShake", () => {
  it("counts time remaining down and floors at zero", () => {
    const state = createShakeState();
    triggerShake(state, 6);

    updateShake(state, 1);

    expect(state.timeRemaining).toBe(0);
  });
});

describe("shakeOffset", () => {
  it("is zero while idle", () => {
    const state = createShakeState();

    expect(shakeOffset(state, false)).toEqual({ x: 0, y: 0 });
  });

  it("is zero when reduced motion is requested, even mid-shake", () => {
    const state = createShakeState();
    triggerShake(state, 6);

    expect(shakeOffset(state, true)).toEqual({ x: 0, y: 0 });
  });

  it("stays within the current amplitude while shaking", () => {
    const state = createShakeState();
    triggerShake(state, 6);

    const offset = shakeOffset(state, false);

    expect(Math.abs(offset.x)).toBeLessThanOrEqual(6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(6);
  });

  it("decays toward zero as time runs out", () => {
    const state = createShakeState();
    triggerShake(state, 6);
    updateShake(state, 0.11);

    // ~1/12 of the duration remains, so the offset should be tiny.
    const offset = shakeOffset(state, false);

    expect(Math.abs(offset.x)).toBeLessThan(1);
    expect(Math.abs(offset.y)).toBeLessThan(1);
  });
});
