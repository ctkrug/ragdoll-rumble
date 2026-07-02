import { floorHeightAt, generateArena, type Arena } from "../arena/generator";
import { createRagdoll, ragdollPointList, type Ragdoll } from "../ragdoll/skeleton";
import { resolveCapsuleCollision } from "../physics/capsule";
import { step, type World } from "../physics/solver";
import type { Vec2 } from "../physics/vec2";

export interface DuelScene {
  world: World;
  arena: Arena;
  ragdollA: Ragdoll;
  ragdollB: Ragdoll;
  /** Whether any limb of ragdollA overlapped a limb of ragdollB during the most recent stepDuel call. */
  contactThisStep: boolean;
  /** Roughly where the most recent contactThisStep overlap happened; null when there's been none yet. */
  contactPoint: Vec2 | null;
}

export interface RagdollCollisionResult {
  contact: boolean;
  /** The midpoint of whichever colliding limb pair was found last, or null if nothing overlapped. */
  point: Vec2 | null;
}

/** A standing ragdoll's total height, head-top to foot, at scale 1. */
const RAGDOLL_HEIGHT = 134;
/** Furthest an arm can reach from the neck horizontally (shoulder offset + both arm bones), at scale 1. */
const ARM_REACH = 70;

/**
 * Lays out two ragdolls facing each other on a shared floor, sized relative
 * to the arena so they read clearly regardless of viewport size. Scale is
 * capped by width as well as height: on a narrow viewport, sizing purely off
 * height can make the ragdolls' reach exceed the gap between them, so a
 * fully splayed arm immediately collides at full force and flings both rigs
 * off-screen instead of settling.
 *
 * `seed` drives the procedural arena layout (floor tilt + platforms) so a
 * rematch varies by default; pass an explicit seed to reproduce a match.
 */
export function createDuelScene(
  width: number,
  height: number,
  seed: number = Math.floor(Math.random() * 2 ** 32),
): DuelScene {
  const arena = generateArena(width, height, seed);
  const heightScale = (height * 0.4) / RAGDOLL_HEIGHT;
  const widthScale = (width * 0.3) / (2 * ARM_REACH);
  const scale = Math.min(heightScale, widthScale);

  const xA = width * 0.35;
  const xB = width * 0.65;
  const ragdollA = createRagdoll(xA, floorHeightAt(arena, xA) - 112 * scale, scale);
  const ragdollB = createRagdoll(xB, floorHeightAt(arena, xB) - 112 * scale, scale);

  const world: World = {
    points: [...ragdollPointList(ragdollA), ...ragdollPointList(ragdollB)],
    constraints: [...ragdollA.bones, ...ragdollB.bones],
    angleConstraints: [...ragdollA.joints, ...ragdollB.joints],
    gravity: { x: 0, y: 1400 },
    damping: 0.985,
    geometry: arena.geometry,
  };

  const scene: DuelScene = {
    world,
    arena,
    ragdollA,
    ragdollB,
    contactThisStep: false,
    contactPoint: null,
  };
  world.onIteration = () => {
    const result = resolveRagdollCollisions(ragdollA, ragdollB);
    if (result.contact) {
      scene.contactThisStep = true;
      scene.contactPoint = result.point;
    }
  };

  return scene;
}

/** Pushes every limb of ragdoll A apart from every overlapping limb of ragdoll B. */
export function resolveRagdollCollisions(a: Ragdoll, b: Ragdoll): RagdollCollisionResult {
  let contact = false;
  let point: Vec2 | null = null;
  for (const limbA of a.limbs) {
    for (const limbB of b.limbs) {
      if (resolveCapsuleCollision(limbA, limbB)) {
        contact = true;
        point = {
          x: (limbA.a.pos.x + limbB.a.pos.x) / 2,
          y: (limbA.a.pos.y + limbB.a.pos.y) / 2,
        };
      }
    }
  }
  return { contact, point };
}

/** Steps the physics world one fixed tick, resetting/recomputing contactThisStep as it goes. */
export function stepDuel(scene: DuelScene, dt: number): void {
  scene.contactThisStep = false;
  step(scene.world, dt);
}
