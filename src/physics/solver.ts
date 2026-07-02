import type { VerletPoint } from "./point";
import { integratePoint } from "./point";
import type { DistanceConstraint } from "./constraint";
import { satisfyDistanceConstraint } from "./constraint";
import type { Vec2 } from "./vec2";

export interface World {
  points: VerletPoint[];
  constraints: DistanceConstraint[];
  gravity: Vec2;
  damping: number;
  /** Ground line; points are clamped above it. */
  floorY: number;
}

const CONSTRAINT_ITERATIONS = 8;

/**
 * One fixed-timestep world step: integrate every point, then relax every
 * constraint several times so chains of joints converge instead of jittering.
 */
export function step(world: World, dt: number): void {
  for (const point of world.points) {
    integratePoint(point, world.gravity, world.damping, dt);
  }

  for (let i = 0; i < CONSTRAINT_ITERATIONS; i++) {
    for (const constraint of world.constraints) {
      satisfyDistanceConstraint(constraint);
    }
    applyFloorCollision(world);
  }
}

function applyFloorCollision(world: World): void {
  for (const point of world.points) {
    if (point.pinned) continue;
    if (point.pos.y > world.floorY) {
      point.pos.y = world.floorY;
    }
  }
}
