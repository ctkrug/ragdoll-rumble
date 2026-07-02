export interface Stage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Sizes the canvas backing store to devicePixelRatio * CSS size so strokes
 * stay crisp on retina displays, and keeps it in sync across resizes.
 */
export function createStage(canvas: HTMLCanvasElement): Stage {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const stage: Stage = { canvas, ctx, width: 0, height: 0 };
  resizeStage(stage);
  window.addEventListener("resize", () => resizeStage(stage));

  return stage;
}

export function resizeStage(stage: Stage): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = stage.canvas.getBoundingClientRect();

  stage.width = rect.width;
  stage.height = rect.height;
  stage.canvas.width = Math.round(rect.width * dpr);
  stage.canvas.height = Math.round(rect.height * dpr);
  stage.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
