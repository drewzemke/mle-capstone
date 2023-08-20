import { ClassificationResults, LabeledBox } from "./types";

export function drawBoxes(ctx: CanvasRenderingContext2D, boxes: LabeledBox[]) {
  ctx.font = "bold 12px monospace";
  ctx.strokeStyle = "orange";
  ctx.lineWidth = 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  const textPadding = 3;
  const textboxHeight = 12 + 2 * textPadding;

  boxes.forEach(({ box, label }) => {
    const { centerX, centerY, width, height } = box;

    ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

    const bottomLeftX = centerX - width / 2;
    const bottomLeftY = centerY + height / 2;
    const textboxWidth = ctx.measureText(label).width + 2 * textPadding;

    ctx.fillStyle = "orange";
    ctx.fillRect(bottomLeftX, bottomLeftY - textboxHeight, textboxWidth, textboxHeight);

    ctx.fillStyle = "white";
    ctx.fillText(label, bottomLeftX + textPadding, bottomLeftY - textPadding);
  });
}

export function drawFps(ctx: CanvasRenderingContext2D, fps: number) {
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "white";

  ctx.fillText(`${fps.toFixed(1)} FPS`, ctx.canvas.width - 70, 18);
}

// how many of the top scores to show
const TOP_N_SCORES = 5;

// score threshold for predicting a label
const SCORE_THRESHOLD = 0.5;

export function drawLetterProbs(ctx: CanvasRenderingContext2D, results: ClassificationResults) {
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "white";

  const scores = results.scores.slice(0, TOP_N_SCORES);

  for (let i = 0; i < scores.length; i++) {
    ctx.fillText(`${scores[i].label}: ${scores[i].score.toFixed(2)}`, 8, 18 + 20 * i);

    // TODO: measure where these bars should go more carefully

    ctx.fillRect(70, 6 + 20 * i, 100 * scores[i].score, 10);
  }

  if (results.best.score > SCORE_THRESHOLD) {
    ctx.font = "bold 92px monospace";
    ctx.fillText(`${results.best.label}`, ctx.canvas.width / 2 - 20, 125);
  }
}
