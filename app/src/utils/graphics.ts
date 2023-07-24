import { LabeledBox } from "./types";

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
