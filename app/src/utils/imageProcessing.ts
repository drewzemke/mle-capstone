import { Tensor } from "onnxruntime-web";
import cv from "@techstark/opencv-js";
import { ClassificationResults, ClassificationScore, LabeledBox, Size } from "./types";
import { labels } from "../labels";

const NUM_CLASSES = labels.length;

export async function computeInputTensor(canvas: HTMLCanvasElement, modelSize: number) {
  // load image from canvas
  const imgMat = cv.imread(canvas);

  // color conversion
  const mat = new cv.Mat(imgMat.rows, imgMat.cols, cv.CV_8UC3);
  cv.cvtColor(imgMat, mat, cv.COLOR_RGBA2BGR);

  // resize image
  cv.resize(mat, mat, new cv.Size(modelSize, modelSize));
  const input = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(modelSize, modelSize),
    new cv.Scalar(0, 0, 0),
    true,
    false
  );

  // gotta manually release these for some reason
  // maybe it'd be slightly faster to hold to them and reuse them?
  imgMat.delete();
  mat.delete();

  // convert to tensor. shape is based on 1 image, 3 channels, width and height
  const modelInputShape = [1, 3, modelSize, modelSize];
  const tensor = new Tensor("float32", input.data32F, modelInputShape);

  return tensor;
}

export function computeBoxes(output: Tensor, canvasSize: Size, modelSize: number) {
  const boxes: LabeledBox[] = [];
  const ratioX = modelSize / canvasSize.width;
  const ratioY = modelSize / canvasSize.height;

  for (let index = 0; index < output.dims[1]; index++) {
    // each "row" represents one prediction
    const row = output.data.slice(
      index * output.dims[2],
      (index + 1) * output.dims[2]
    ) as Float32Array;

    // the first four numbers describe the box
    const modelBox = row.slice(0, 4);

    // the rest correspond to probabilities of the individual classes
    const scores = row.slice(4, 4 + NUM_CLASSES);

    // find the label for this box from the largest score
    const score = Math.max(...scores);
    const label = scores.indexOf(score);

    // rescale the box based on the canvas dimensions
    const [x, y, w, h] = modelBox;
    const centerX = x / ratioX;
    const centerY = y / ratioY;
    const width = w / ratioX;
    const height = h / ratioY;
    const scaledBox = { centerX, centerY, width, height };

    boxes.push({ box: scaledBox, score, label: labels[label] });
  }

  return boxes;
}

export function computeProbabilities(output: Tensor): ClassificationResults {
  // output.data is a Float32Array with as many elements as there are labels
  const scores = output.data as Float32Array;

  let bestScoreIndex = 0;
  const labeledScores: ClassificationScore[] = [];

  for (let index = 0; index < scores.length; index++) {
    const score = scores[index];
    labeledScores.push({ label: labels[index], score });
    if (score > scores[bestScoreIndex]) {
      bestScoreIndex = index;
    }
  }

  labeledScores.sort((a, b) => b.score - a.score);

  const best = { label: labels[bestScoreIndex], score: scores[bestScoreIndex] };
  return {
    best,
    scores: labeledScores,
  };
}
