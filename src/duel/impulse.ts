import { add, type Vec2 } from "../physics/vec2";
import type { VerletPoint } from "../physics/point";
import type { Ragdoll } from "../ragdoll/skeleton";

export type ImpulseAction = "punch" | "kick" | "lunge";

/** x is toward the opponent (flipped by direction), y is a slight upward lift. */
const PUNCH_IMPULSE: Vec2 = { x: 14, y: -3 };
const KICK_IMPULSE: Vec2 = { x: 18, y: -4 };
const LUNGE_IMPULSE: Vec2 = { x: 10, y: -2 };

/**
 * Nudges a point's position directly, leaving prevPos untouched: Verlet's
 * implicit velocity (pos - prevPos) reads that nudge as an instant velocity
 * kick, which is exactly the feel a punch/kick/lunge impulse wants. (Contrast
 * with satisfyAngleConstraint, which deliberately shifts prevPos along with
 * pos so a *correction* reads as velocity-neutral — here we want the opposite.)
 */
export function applyPointImpulse(point: VerletPoint, impulse: Vec2, direction: 1 | -1): void {
  if (point.pinned) return;
  point.pos = add(point.pos, { x: impulse.x * direction, y: impulse.y });
}

/** Applies a named combat impulse to the appropriate limb(s), aimed at the opponent. */
export function applyImpulse(ragdoll: Ragdoll, action: ImpulseAction, direction: 1 | -1): void {
  switch (action) {
    case "punch":
      applyPointImpulse(
        direction > 0 ? ragdoll.points.rightHand : ragdoll.points.leftHand,
        PUNCH_IMPULSE,
        direction,
      );
      return;
    case "kick":
      applyPointImpulse(
        direction > 0 ? ragdoll.points.rightFoot : ragdoll.points.leftFoot,
        KICK_IMPULSE,
        direction,
      );
      return;
    case "lunge":
      applyPointImpulse(ragdoll.points.pelvis, LUNGE_IMPULSE, direction);
      return;
  }
}
