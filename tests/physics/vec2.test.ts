import { describe, expect, it } from "vitest";
import { cross, dot } from "../../src/physics/vec2";

describe("dot", () => {
  it("returns the scalar product of two vectors", () => {
    expect(dot({ x: 2, y: 3 }, { x: 4, y: 5 })).toBe(23);
  });

  it("is zero for perpendicular vectors", () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  });
});

describe("cross", () => {
  it("is positive when b is counterclockwise from a", () => {
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
  });

  it("is negative when b is clockwise from a", () => {
    expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
  });

  it("is zero for parallel vectors", () => {
    expect(cross({ x: 2, y: 4 }, { x: 1, y: 2 })).toBe(0);
  });
});
