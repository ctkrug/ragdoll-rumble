import type { Stage } from "./canvas";
import type { DuelScene } from "../duel/scene";
import { renderRagdoll } from "./ragdoll";

const BG = "#0b0d17";
const FLOOR_COLOR = "#2a3155";
const FLOOR_GLOW = "#29e0ff";

const PLAYER_ONE_THEME = { limbColor: "#ff2e6d", headColor: "#ff6b9c", glowColor: "#ff2e6d" };
const PLAYER_TWO_THEME = { limbColor: "#29e0ff", headColor: "#7cf0ff", glowColor: "#29e0ff" };

export function renderDuelScene(stage: Stage, scene: DuelScene): void {
  const { ctx } = stage;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, stage.width, stage.height);

  ctx.save();
  ctx.strokeStyle = FLOOR_COLOR;
  ctx.shadowColor = FLOOR_GLOW;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, scene.world.floorY);
  ctx.lineTo(stage.width, scene.world.floorY);
  ctx.stroke();
  ctx.restore();

  renderRagdoll(ctx, scene.ragdollA, PLAYER_ONE_THEME);
  renderRagdoll(ctx, scene.ragdollB, PLAYER_TWO_THEME);
}
