import { describe, expect, it } from "vitest";
import { floorHeightAt, generateArena } from "../../src/arena/generator";

const WIDTH = 1440;
const HEIGHT = 900;

describe("generateArena", () => {
  it("is reproducible for the same seed and dimensions", () => {
    const a = generateArena(WIDTH, HEIGHT, 42);
    const b = generateArena(WIDTH, HEIGHT, 42);

    expect(b).toEqual(a);
  });

  it("varies across seeds", () => {
    const a = generateArena(WIDTH, HEIGHT, 1);
    const b = generateArena(WIDTH, HEIGHT, 2);

    expect(b).not.toEqual(a);
  });

  it("spans the floor across the full arena width", () => {
    const arena = generateArena(WIDTH, HEIGHT, 7);

    expect(arena.floor.a.x).toBe(0);
    expect(arena.floor.b.x).toBe(WIDTH);
  });

  it("generates one to three platforms, each fully inside the arena bounds", () => {
    for (let seed = 0; seed < 25; seed++) {
      const arena = generateArena(WIDTH, HEIGHT, seed);

      expect(arena.platforms.length).toBeGreaterThanOrEqual(1);
      expect(arena.platforms.length).toBeLessThanOrEqual(3);
      expect(arena.geometry).toEqual([arena.floor, ...arena.platforms]);

      for (const platform of arena.platforms) {
        expect(platform.a.x).toBeGreaterThanOrEqual(0);
        expect(platform.b.x).toBeLessThanOrEqual(WIDTH);
        expect(platform.a.y).toBeGreaterThan(0);
        expect(platform.a.y).toBeLessThan(arena.floor.a.y);
      }
    }
  });
});

describe("floorHeightAt", () => {
  it("returns the floor's endpoint heights at the arena edges", () => {
    const arena = generateArena(WIDTH, HEIGHT, 3);

    expect(floorHeightAt(arena, 0)).toBeCloseTo(arena.floor.a.y);
    expect(floorHeightAt(arena, WIDTH)).toBeCloseTo(arena.floor.b.y);
  });

  it("interpolates linearly between the edges", () => {
    const arena = generateArena(WIDTH, HEIGHT, 3);
    const mid = floorHeightAt(arena, WIDTH / 2);

    expect(mid).toBeCloseTo((arena.floor.a.y + arena.floor.b.y) / 2);
  });

  it("clamps outside the arena's x range", () => {
    const arena = generateArena(WIDTH, HEIGHT, 3);

    expect(floorHeightAt(arena, -500)).toBeCloseTo(arena.floor.a.y);
    expect(floorHeightAt(arena, WIDTH + 500)).toBeCloseTo(arena.floor.b.y);
  });
});
