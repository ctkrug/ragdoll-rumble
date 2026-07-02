import { createRagdoll, ragdollPointList, type Ragdoll } from "../ragdoll/skeleton";
import { resolveCapsuleCollision } from "../physics/capsule";
import { step, type World } from "../physics/solver";

export interface DuelScene {
  world: World;
  ragdollA: Ragdoll;
  ragdollB: Ragdoll;
}

/** A standing ragdoll's total height, head-top to foot, at scale 1. */
const RAGDOLL_HEIGHT = 134;

/**
 * Lays out two ragdolls facing each other on a shared floor, sized relative
 * to the arena so they read clearly regardless of viewport size.
 */
export function createDuelScene(width: number, height: number): DuelScene {
  const floorY = height * 0.85;
  const scale = (height * 0.4) / RAGDOLL_HEIGHT;
  const neckY = floorY - 112 * scale;

  const ragdollA = createRagdoll(width * 0.35, neckY, scale);
  const ragdollB = createRagdoll(width * 0.65, neckY, scale);

  const world: World = {
    points: [...ragdollPointList(ragdollA), ...ragdollPointList(ragdollB)],
    constraints: [...ragdollA.bones, ...ragdollB.bones],
    angleConstraints: [...ragdollA.joints, ...ragdollB.joints],
    gravity: { x: 0, y: 1400 },
    damping: 0.985,
    floorY,
  };

  return { world, ragdollA, ragdollB };
}

/** Pushes every limb of ragdoll A apart from every overlapping limb of ragdoll B. */
export function resolveRagdollCollisions(a: Ragdoll, b: Ragdoll): void {
  for (const limbA of a.limbs) {
    for (const limbB of b.limbs) {
      resolveCapsuleCollision(limbA, limbB);
    }
  }
}

export function stepDuel(scene: DuelScene, dt: number): void {
  step(scene.world, dt);
  resolveRagdollCollisions(scene.ragdollA, scene.ragdollB);
}
