import "./style.css";
import { createStage } from "./render/canvas";
import { createChainWorld } from "./demo/chain";
import { renderChain } from "./demo/render";
import { step } from "./physics/solver";

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("#stage canvas not found");

const stage = createStage(canvas);
const world = createChainWorld(stage.width / 2, 80, 12, 28);

const FIXED_DT = 1 / 60;
let lastTime = performance.now();
let accumulator = 0;

function tick(now: number): void {
  accumulator += Math.min(now - lastTime, 250) / 1000;
  lastTime = now;

  while (accumulator >= FIXED_DT) {
    step(world, FIXED_DT);
    accumulator -= FIXED_DT;
  }

  renderChain(stage, world);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
