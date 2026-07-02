import type { Stage } from "../render/canvas";
import type { World } from "../physics/solver";

export function renderChain(stage: Stage, world: World): void {
  const { ctx } = stage;

  ctx.clearRect(0, 0, stage.width, stage.height);

  ctx.strokeStyle = "#7dd3fc";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  world.points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point.pos.x, point.pos.y);
    else ctx.lineTo(point.pos.x, point.pos.y);
  });
  ctx.stroke();

  ctx.fillStyle = "#f472b6";
  for (const point of world.points) {
    ctx.beginPath();
    ctx.arc(point.pos.x, point.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
