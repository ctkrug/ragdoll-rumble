import { describe, expect, it } from "vitest";
import { createRng, randRange } from "../../src/arena/prng";

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);

    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());

    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces a different sequence for a different seed", () => {
    const a = createRng(1);
    const b = createRng(2);

    const sequenceA = Array.from({ length: 5 }, () => a());
    const sequenceB = Array.from({ length: 5 }, () => b());

    expect(sequenceA).not.toEqual(sequenceB);
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(7);

    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("randRange", () => {
  it("stays within [min, max)", () => {
    const rng = createRng(99);

    for (let i = 0; i < 1000; i++) {
      const value = randRange(rng, 10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
    }
  });
});
