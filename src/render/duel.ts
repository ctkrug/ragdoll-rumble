import type { Stage } from "./canvas";
import type { Arena } from "../arena/generator";
import type { DuelScene } from "../duel/scene";
import { renderRagdoll } from "./ragdoll";

const BG = "#0b0d17";
const FLOOR_COLOR = "#2a3155";
const FLOOR_GLOW = "#29e0ff";

/** Chunky pixel-edged bar (surface-2) with a bright top-edge light strip. */
const PLATFORM_FILL = "#1f2540";
const PLATFORM_EDGE_GLOW = "#29e0ff";
const PLATFORM_THICKNESS = 10;

const PLAYER_ONE_THEME = { limbColor: "#ff2e6d", headColor: "#ff6b9c", glowColor: "#ff2e6d" };
const PLAYER_TWO_THEME = { limbColor: "#29e0ff", headColor: "#7cf0ff", glowColor: "#29e0ff" };

export function renderDuelScene(stage: Stage, scene: DuelScene): void {
  const { ctx } = stage;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, stage.width, stage.height);

  renderArena(ctx, scene.arena);

  renderRagdoll(ctx, scene.ragdollA, PLAYER_ONE_THEME);
  renderRagdoll(ctx, scene.ragdollB, PLAYER_TWO_THEME);
}

/**
 * Draws the floor as a thin glowing line (per the original CRT floor look)
 * and platforms as thicker, square-capped bars with a bright top edge, so
 * they read as distinct solid ground rather than more floor line.
 */
function renderArena(ctx: CanvasRenderingContext2D, arena: Arena): void {
  ctx.save();
  ctx.strokeStyle = FLOOR_COLOR;
  ctx.shadowColor = FLOOR_GLOW;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(arena.floor.a.x, arena.floor.a.y);
  ctx.lineTo(arena.floor.b.x, arena.floor.b.y);
  ctx.stroke();
  ctx.restore();

  for (const platform of arena.platforms) {
    ctx.save();
    ctx.lineCap = "butt";
    ctx.strokeStyle = PLATFORM_FILL;
    ctx.shadowColor = PLATFORM_EDGE_GLOW;
    ctx.shadowBlur = 6;
    ctx.lineWidth = PLATFORM_THICKNESS;
    ctx.beginPath();
    ctx.moveTo(platform.a.x, platform.a.y);
    ctx.lineTo(platform.b.x, platform.b.y);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.strokeStyle = PLATFORM_EDGE_GLOW;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(platform.a.x, platform.a.y - PLATFORM_THICKNESS / 2);
    ctx.lineTo(platform.b.x, platform.b.y - PLATFORM_THICKNESS / 2);
    ctx.stroke();
    ctx.restore();
  }
}
