import type { VerletPoint } from "./point";
import { integratePoint } from "./point";
import type { DistanceConstraint } from "./constraint";
import { satisfyDistanceConstraint } from "./constraint";
import type { AngleConstraint } from "./angleConstraint";
import { satisfyAngleConstraint } from "./angleConstraint";
import type { Segment } from "./segment";
import { resolveSegmentCollision } from "./segment";
import type { Vec2 } from "./vec2";

export interface World {
  points: VerletPoint[];
  constraints: DistanceConstraint[];
  angleConstraints?: AngleConstraint[];
  gravity: Vec2;
  damping: number;
  /** Floor/platform surfaces; points are clamped above whichever they penetrate. */
  geometry: Segment[];
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

  // Snapshot each point's post-integration position once, before any
  // relaxation: resolveSegmentCollision uses it to tell "was this point on
  // the surface's near side before this frame's constraint solving" from
  // "has it always been on the far side" (e.g. resting under a floating
  // platform). point.prevPos can't serve as that reference — angle-constraint
  // corrections deliberately shift it mid-frame to stay velocity-neutral, so
  // it drifts alongside pos under sustained joint load instead of holding
  // still as a frame-start snapshot.
  const frameStartPositions = new Map<VerletPoint, Vec2>(
    world.points.map((point) => [point, { ...point.pos }]),
  );

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
    applyGeometryCollision(world, frameStartPositions);
  }
}

function applyGeometryCollision(world: World, frameStartPositions: Map<VerletPoint, Vec2>): void {
  for (const point of world.points) {
    const frameStartPos = frameStartPositions.get(point) ?? point.pos;
    for (const segment of world.geometry) {
      resolveSegmentCollision(point, segment, FLOOR_FRICTION, frameStartPos);
    }
  }
}
