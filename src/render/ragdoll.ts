import type { Ragdoll } from "../ragdoll/skeleton";

export interface RagdollTheme {
  limbColor: string;
  headColor: string;
  glowColor: string;
}

/**
 * Draws every limb as a round-capped stroke (a cheap capsule approximation)
 * and the head as a filled circle, with a neon glow matching docs/DESIGN.md.
 */
export function renderRagdoll(
  ctx: CanvasRenderingContext2D,
  ragdoll: Ragdoll,
  theme: RagdollTheme,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = theme.glowColor;
  ctx.shadowBlur = 10;

  ctx.strokeStyle = theme.limbColor;
  for (const limb of ragdoll.limbs) {
    ctx.lineWidth = limb.radius * 2;
    ctx.beginPath();
    ctx.moveTo(limb.a.pos.x, limb.a.pos.y);
    ctx.lineTo(limb.b.pos.x, limb.b.pos.y);
    ctx.stroke();
  }

  ctx.fillStyle = theme.headColor;
  ctx.beginPath();
  ctx.arc(ragdoll.points.head.pos.x, ragdoll.points.head.pos.y, ragdoll.headRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
