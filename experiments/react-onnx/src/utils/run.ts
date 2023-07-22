import { ModelManager } from "./ModelManager";
import { computeInputTensor, computeBoxes } from "./imageProcessing";

export async function run(canvas: HTMLCanvasElement, modelManager: ModelManager) {
  console.log("starting inference...");
  const inferenceStartTime = new Date();

  // 1. convert to tensor
  console.log("1. computing image tensor...");
  const imageTensor = await computeInputTensor(canvas, modelManager.modelSize);
  console.log(
    `   image tensor computed in ${new Date().getTime() - inferenceStartTime.getTime()} ms`
  );

  // 2. create models
  const infStartTime = new Date();
  console.log("2. running model...");
  const inferenceResults = await modelManager.execute(imageTensor);
  console.log(`   model ran in ${new Date().getTime() - infStartTime.getTime()} ms`);

  // 3. process results
  const processStartTime = new Date();
  console.log("3. processing results...");
  const results = computeBoxes(
    inferenceResults,
    { width: canvas.width, height: canvas.height },
    modelManager.modelSize
  );
  console.log(`   processed results in ${new Date().getTime() - processStartTime.getTime()} ms`);

  // 4. return predictions
  console.log(`inference complete in ${new Date().getTime() - inferenceStartTime.getTime()} ms`);
  return results;
}
