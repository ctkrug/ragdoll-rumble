import { describe, expect, it } from "vitest";
import { parseTouchButton } from "../../src/ui/touchControls";

describe("parseTouchButton", () => {
  it("maps player 1 buttons to ragdoll A", () => {
    expect(parseTouchButton("1", "punch")).toEqual({ player: "A", action: "punch" });
  });

  it("maps player 2 buttons to ragdoll B", () => {
    expect(parseTouchButton("2", "kick")).toEqual({ player: "B", action: "kick" });
  });

  it("accepts all three impulse actions", () => {
    expect(parseTouchButton("1", "lunge")).toEqual({ player: "A", action: "lunge" });
  });

  it("returns null for an unrecognized player", () => {
    expect(parseTouchButton("3", "punch")).toBeNull();
  });

  it("returns null for an unrecognized action", () => {
    expect(parseTouchButton("1", "block")).toBeNull();
  });

  it("returns null when either attribute is missing", () => {
    expect(parseTouchButton(undefined, "punch")).toBeNull();
    expect(parseTouchButton("1", undefined)).toBeNull();
  });
});
