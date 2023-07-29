import { ModelManager } from "./ModelManager";
import { TaskTimer } from "./TaskTimer";
import { computeInputTensor, computeBoxes } from "./imageProcessing";

export async function run(
  canvas: HTMLCanvasElement,
  modelManager: ModelManager,
  timer?: TaskTimer
) {
  timer?.startParent("inference");

  // 1. convert to tensor
  timer?.start("compute image tensor");
  const imageTensor = await computeInputTensor(canvas, modelManager.modelSize);
  timer?.finish("compute image tensor");

  // 2. create models

  timer?.startParent("execute model");
  const inferenceResults = await modelManager.execute(imageTensor, timer);
  timer?.finish("execute model");

  // 3. process results
  timer?.start("process results");
  const results = computeBoxes(
    inferenceResults,
    { width: canvas.width, height: canvas.height },
    modelManager.modelSize
  );
  timer?.finish("process results");

  // 4. return predictions
  timer?.finish("inference");
  return results;
}
