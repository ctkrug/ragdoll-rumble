import type { VerletPoint } from "./point";
import { integratePoint } from "./point";
import type { DistanceConstraint } from "./constraint";
import { satisfyDistanceConstraint } from "./constraint";
import type { AngleConstraint } from "./angleConstraint";
import { satisfyAngleConstraint } from "./angleConstraint";
import type { Vec2 } from "./vec2";

export interface World {
  points: VerletPoint[];
  constraints: DistanceConstraint[];
  angleConstraints?: AngleConstraint[];
  gravity: Vec2;
  damping: number;
  /** Ground line; points are clamped above it. */
  floorY: number;
  /**
   * Optional extra constraint (e.g. ragdoll-vs-ragdoll capsule collision) run
   * every iteration alongside bone/joint relaxation. Resolving it only once
   * per frame, after bones have already settled, makes it fight the bone
   * constraints across frames and pump energy into the system instead of
   * converging — folding it into the same iterative loop keeps it stable.
   */
  onIteration?: () => void;
}

const CONSTRAINT_ITERATIONS = 12;
/** Bleeds horizontal velocity for points resting on the floor so a settled ragdoll stops. */
const FLOOR_FRICTION = 0.2;

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
    if (world.angleConstraints) {
      for (const angleConstraint of world.angleConstraints) {
        satisfyAngleConstraint(angleConstraint);
      }
    }
    world.onIteration?.();
    applyFloorCollision(world);
  }
}

function applyFloorCollision(world: World): void {
  for (const point of world.points) {
    if (point.pinned) continue;
    if (point.pos.y > world.floorY) {
      point.pos.y = world.floorY;
      point.prevPos.x += (point.pos.x - point.prevPos.x) * FLOOR_FRICTION;
    }
  }
}
