import { afterEach, describe, expect, it } from "vitest";
import {
  createSfxEngine,
  ensureAudioContext,
  isMuted,
  playImpact,
  playKnockout,
  playStep,
  playSwing,
  playUiClick,
  setMuted,
  toggleMute,
} from "../../src/audio/sfx";

// This suite runs in vitest's node environment, which has neither `window`
// nor `AudioContext` nor `localStorage` — exactly the "unsupported
// environment" docs/DESIGN.md requires every SFX call site to guard for.
// That absence is the thing being tested: every function here must degrade
// to a safe no-op rather than throwing.

describe("createSfxEngine", () => {
  it("starts with no audio context and unmuted, absent any stored preference", () => {
    const engine = createSfxEngine();

    expect(engine.context).toBeNull();
    expect(engine.masterGain).toBeNull();
    expect(engine.muted).toBe(false);
  });
});

describe("ensureAudioContext", () => {
  it("leaves context null when no AudioContext constructor is available", () => {
    const engine = createSfxEngine();

    ensureAudioContext(engine);

    expect(engine.context).toBeNull();
  });
});

describe("mute state", () => {
  it("toggles and reports the new value", () => {
    const engine = createSfxEngine();

    const nowMuted = toggleMute(engine);

    expect(nowMuted).toBe(true);
    expect(isMuted(engine)).toBe(true);
  });

  it("setMuted sets an explicit value", () => {
    const engine = createSfxEngine();

    setMuted(engine, true);
    expect(isMuted(engine)).toBe(true);

    setMuted(engine, false);
    expect(isMuted(engine)).toBe(false);
  });

  it("does not throw persisting mute state without localStorage available", () => {
    const engine = createSfxEngine();

    expect(() => setMuted(engine, true)).not.toThrow();
  });
});

describe("play functions without an audio context", () => {
  it("are all safe no-ops", () => {
    const engine = createSfxEngine();

    expect(() => {
      playStep(engine);
      playSwing(engine);
      playImpact(engine);
      playKnockout(engine);
      playUiClick(engine);
    }).not.toThrow();
  });
});

describe("localStorage persistence", () => {
  afterEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
  });

  it("round-trips the muted preference through localStorage when it's available", () => {
    if (typeof localStorage === "undefined") return;

    const engine = createSfxEngine();
    setMuted(engine, true);

    const reloaded = createSfxEngine();

    expect(reloaded.muted).toBe(true);
  });
});
