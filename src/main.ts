import "./style.css";
import { createStage } from "./render/canvas";
import { createDuelScene, stepDuel } from "./duel/scene";
import {
  applyPlayerActions,
  resolveActions,
  PLAYER_ONE_CONTROLS,
  PLAYER_TWO_CONTROLS,
} from "./duel/controls";
import { isOffArena, isPinnedFlat } from "./duel/koDetection";
import { advanceMatch, createMatchState, MATCH_OVER_INPUT_DELAY_SECONDS } from "./duel/round";
import { createKeyboardInput } from "./input/keyboard";
import { renderDuelScene } from "./render/duel";
import { createShakeState, shakeOffset, triggerShake, updateShake } from "./render/screenShake";
import { queryHudElements, renderHud } from "./ui/hud";
import { wireTouchControls } from "./ui/touchControls";

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("#stage canvas not found");

const stage = createStage(canvas);
let scene = createDuelScene(stage.width, stage.height);
let match = createMatchState();
const keyboard = createKeyboardInput(window);
const shake = createShakeState();
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
wireTouchControls(
  document,
  () => scene,
  () => match.phase,
  () => triggerShake(shake),
);
const hud = queryHudElements(document);

function startRematch(): void {
  match = createMatchState();
  scene = createDuelScene(stage.width, stage.height);
}

hud.rematchButton.addEventListener("click", () => {
  if (match.phase !== "matchOver") return;
  startRematch();
});

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
    if (match.phase === "fighting") {
      const actionsA = applyPlayerActions(
        scene.ragdollA,
        scene.ragdollB,
        keyboard,
        PLAYER_ONE_CONTROLS,
      );
      const actionsB = applyPlayerActions(
        scene.ragdollB,
        scene.ragdollA,
        keyboard,
        PLAYER_TWO_CONTROLS,
      );
      if (actionsA.length > 0 || actionsB.length > 0) triggerShake(shake);
    } else if (match.phase === "matchOver") {
      // Still consume presses outside "fighting" so a trailing key doesn't
      // queue up and throw a punch the instant the round resumes. A punch/
      // kick/lunge from either player during matchOver instead requests a
      // rematch, mirroring the on-screen button.
      const pressedA = resolveActions(keyboard, PLAYER_ONE_CONTROLS).length > 0;
      const pressedB = resolveActions(keyboard, PLAYER_TWO_CONTROLS).length > 0;
      if (match.phaseTime >= MATCH_OVER_INPUT_DELAY_SECONDS && (pressedA || pressedB)) {
        startRematch();
      }
    } else {
      resolveActions(keyboard, PLAYER_ONE_CONTROLS);
      resolveActions(keyboard, PLAYER_TWO_CONTROLS);
    }

    stepDuel(scene, FIXED_DT);
    updateShake(shake, FIXED_DT);

    const previousPhase = match.phase;
    advanceMatch(
      match,
      {
        offArenaA: isOffArena(scene.ragdollA, scene.arena),
        offArenaB: isOffArena(scene.ragdollB, scene.arena),
        downA: isPinnedFlat(scene.ragdollA, scene.arena),
        downB: isPinnedFlat(scene.ragdollB, scene.arena),
      },
      FIXED_DT,
    );
    // A fresh arena and starting pose for every round, not just every match,
    // so a rematch (and every round within it) varies per docs/VISION.md.
    if (previousPhase === "roundOver" && match.phase === "countdown") {
      scene = createDuelScene(stage.width, stage.height);
    }

    accumulator -= FIXED_DT;
  }

  renderDuelScene(stage, scene, shakeOffset(shake, reducedMotionQuery.matches));
  renderHud(hud, match);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
