import "./style.css";
import { createStage } from "./render/canvas";
import { createDuelScene, stepDuel } from "./duel/scene";
import { renderDuelScene } from "./render/duel";

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("#stage canvas not found");

const stage = createStage(canvas);
let scene = createDuelScene(stage.width, stage.height);

// createStage already resizes the canvas backing store on window resize;
// rebuild the scene afterward so ragdoll scale tracks the new arena size.
window.addEventListener("resize", () => {
  scene = createDuelScene(stage.width, stage.height);
});

const FIXED_DT = 1 / 60;
let lastTime = performance.now();
let accumulator = 0;

function tick(now: number): void {
  accumulator += Math.min(now - lastTime, 250) / 1000;
  lastTime = now;

  while (accumulator >= FIXED_DT) {
    stepDuel(scene, FIXED_DT);
    accumulator -= FIXED_DT;
  }

  renderDuelScene(stage, scene);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
