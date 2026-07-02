import { createPoint, type VerletPoint } from "../physics/point";
import { createDistanceConstraint, type DistanceConstraint } from "../physics/constraint";
import { createAngleConstraint, type AngleConstraint } from "../physics/angleConstraint";
import type { Vec2 } from "../physics/vec2";

export interface RagdollPoints {
  head: VerletPoint;
  neck: VerletPoint;
  pelvis: VerletPoint;
  leftShoulder: VerletPoint;
  leftElbow: VerletPoint;
  leftHand: VerletPoint;
  rightShoulder: VerletPoint;
  rightElbow: VerletPoint;
  rightHand: VerletPoint;
  leftHip: VerletPoint;
  leftKnee: VerletPoint;
  leftFoot: VerletPoint;
  rightHip: VerletPoint;
  rightKnee: VerletPoint;
  rightFoot: VerletPoint;
}

/** A renderable/collidable limb segment: two points thickened by radius. */
export interface Limb {
  a: VerletPoint;
  b: VerletPoint;
  radius: number;
}

export interface Ragdoll {
  points: RagdollPoints;
  bones: DistanceConstraint[];
  joints: AngleConstraint[];
  limbs: Limb[];
  headRadius: number;
}

/** Elbows and knees fold to ~20 degrees but never hyperextend past straight. */
const JOINT_MIN_ANGLE = 0.35;
const JOINT_MAX_ANGLE = Math.PI;

const HEAD_RADIUS = 14;
const TORSO_RADIUS = 12;
const STUB_RADIUS = 9;
const ARM_RADIUS = 6;
const LEG_RADIUS = 7;

/**
 * Builds a standing humanoid rig (head, spine, two arms, two legs) centered on
 * (originX, originY) at the neck, in a relaxed standing pose. Bone rest lengths
 * are captured from this pose, so the proportions below define the skeleton.
 */
export function createRagdoll(originX: number, originY: number, scale = 1): Ragdoll {
  const at = (dx: number, dy: number): Vec2 => ({
    x: originX + dx * scale,
    y: originY + dy * scale,
  });

  const points: RagdollPoints = {
    head: createPoint(at(0, -22)),
    neck: createPoint(at(0, 0)),
    pelvis: createPoint(at(0, 42)),
    leftShoulder: createPoint(at(-16, 0)),
    leftElbow: createPoint(at(-16, 26)),
    leftHand: createPoint(at(-16, 50)),
    rightShoulder: createPoint(at(16, 0)),
    rightElbow: createPoint(at(16, 26)),
    rightHand: createPoint(at(16, 50)),
    leftHip: createPoint(at(-10, 42)),
    leftKnee: createPoint(at(-10, 78)),
    leftFoot: createPoint(at(-10, 112)),
    rightHip: createPoint(at(10, 42)),
    rightKnee: createPoint(at(10, 78)),
    rightFoot: createPoint(at(10, 112)),
  };

  const bone = (a: VerletPoint, b: VerletPoint, stiffness = 1): DistanceConstraint =>
    createDistanceConstraint(a, b, stiffness);

  const bones: DistanceConstraint[] = [
    bone(points.neck, points.head),
    bone(points.neck, points.pelvis),
    bone(points.neck, points.leftShoulder),
    bone(points.neck, points.rightShoulder),
    bone(points.leftShoulder, points.leftElbow),
    bone(points.leftElbow, points.leftHand),
    bone(points.rightShoulder, points.rightElbow),
    bone(points.rightElbow, points.rightHand),
    bone(points.pelvis, points.leftHip),
    bone(points.pelvis, points.rightHip),
    bone(points.leftHip, points.leftKnee),
    bone(points.leftKnee, points.leftFoot),
    bone(points.rightHip, points.rightKnee),
    bone(points.rightKnee, points.rightFoot),
    // Torso bracing: keeps the shoulder/hip box from folding sideways under
    // stress, with a little give so the torso can still twist believably.
    bone(points.leftShoulder, points.rightShoulder, 0.5),
    bone(points.leftHip, points.rightHip, 0.5),
    bone(points.leftShoulder, points.rightHip, 0.4),
    bone(points.rightShoulder, points.leftHip, 0.4),
  ];

  const joints: AngleConstraint[] = [
    createAngleConstraint(
      points.leftShoulder,
      points.leftElbow,
      points.leftHand,
      JOINT_MIN_ANGLE,
      JOINT_MAX_ANGLE,
    ),
    createAngleConstraint(
      points.rightShoulder,
      points.rightElbow,
      points.rightHand,
      JOINT_MIN_ANGLE,
      JOINT_MAX_ANGLE,
    ),
    createAngleConstraint(
      points.leftHip,
      points.leftKnee,
      points.leftFoot,
      JOINT_MIN_ANGLE,
      JOINT_MAX_ANGLE,
    ),
    createAngleConstraint(
      points.rightHip,
      points.rightKnee,
      points.rightFoot,
      JOINT_MIN_ANGLE,
      JOINT_MAX_ANGLE,
    ),
  ];

  const limbs: Limb[] = [
    { a: points.neck, b: points.pelvis, radius: TORSO_RADIUS * scale },
    { a: points.neck, b: points.leftShoulder, radius: STUB_RADIUS * scale },
    { a: points.neck, b: points.rightShoulder, radius: STUB_RADIUS * scale },
    { a: points.leftShoulder, b: points.leftElbow, radius: ARM_RADIUS * scale },
    { a: points.leftElbow, b: points.leftHand, radius: ARM_RADIUS * scale },
    { a: points.rightShoulder, b: points.rightElbow, radius: ARM_RADIUS * scale },
    { a: points.rightElbow, b: points.rightHand, radius: ARM_RADIUS * scale },
    { a: points.pelvis, b: points.leftHip, radius: STUB_RADIUS * scale },
    { a: points.pelvis, b: points.rightHip, radius: STUB_RADIUS * scale },
    { a: points.leftHip, b: points.leftKnee, radius: LEG_RADIUS * scale },
    { a: points.leftKnee, b: points.leftFoot, radius: LEG_RADIUS * scale },
    { a: points.rightHip, b: points.rightKnee, radius: LEG_RADIUS * scale },
    { a: points.rightKnee, b: points.rightFoot, radius: LEG_RADIUS * scale },
  ];

  return { points, bones, joints, limbs, headRadius: HEAD_RADIUS * scale };
}

export function ragdollPointList(ragdoll: Ragdoll): VerletPoint[] {
  return Object.values(ragdoll.points);
}
