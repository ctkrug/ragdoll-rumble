import { createPoint } from "../physics/point";
import { createDistanceConstraint } from "../physics/constraint";
import type { World } from "../physics/solver";

/**
 * Builds a pinned rope of Verlet points as a stand-in scene: it proves the
 * integrator, constraints, and solver loop actually hold a chain together
 * under gravity ahead of the full ragdoll rig landing in later build runs.
 */
export function createChainWorld(originX: number, originY: number, links: number, spacing: number): World {
  const points = [];
  for (let i = 0; i < links; i++) {
    points.push(createPoint({ x: originX, y: originY + i * spacing }, i === 0));
  }

  const constraints = [];
  for (let i = 0; i < points.length - 1; i++) {
    constraints.push(createDistanceConstraint(points[i], points[i + 1]));
  }

  return {
    points,
    constraints,
    gravity: { x: 0, y: 900 },
    damping: 0.995,
    floorY: originY + links * spacing + 200,
  };
}
