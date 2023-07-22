import React, { useEffect, useRef, useState } from "react";
import cv from "@techstark/opencv-js";
import * as ort from "onnxruntime-web";
import "./App.css";
import { Tensor } from "onnxruntime-web";
import { labels } from "./labels";

type Size = {
  width: number;
  height: number;
};

// the image size that the model expects
const MODEL_SIZE = 640;

// 1 image, 3 channels, width and height
const modelInputShape = [1, 3, MODEL_SIZE, MODEL_SIZE];

// TODO: learn more about what these mean...
const topk = 100;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;
const numClasses = labels.length;

async function getImageTensor(canvas: HTMLCanvasElement) {
  // 1. load and preprocess the image
  const imgMat = cv.imread(canvas);
  const mat = new cv.Mat(imgMat.rows, imgMat.cols, cv.CV_8UC3);
  cv.cvtColor(imgMat, mat, cv.COLOR_RGBA2BGR);
  cv.resize(mat, mat, new cv.Size(MODEL_SIZE, MODEL_SIZE));
  const input = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(MODEL_SIZE, MODEL_SIZE),
    new cv.Scalar(0, 0, 0),
    true,
    false
  );
  imgMat.delete();
  mat.delete();

  // 2. convert to tensor
  const tensor = new Tensor("float32", input.data32F, modelInputShape);

  // 3. ship it
  return tensor;
}

type Box = { centerX: number; centerY: number; width: number; height: number };
type LabeledBox = { box: Box; label: string; score: number };

function processResults(output: ort.Tensor, canvasSize: Size) {
  const boxes: LabeledBox[] = [];
  const ratioX = MODEL_SIZE / canvasSize.width;
  const ratioY = MODEL_SIZE / canvasSize.height;

  for (let index = 0; index < output.dims[1]; index++) {
    const row = output.data.slice(
      index * output.dims[2],
      (index + 1) * output.dims[2]
    ) as Float32Array;
    const modelBox = row.slice(0, 4);
    const scores = row.slice(4, 4 + numClasses);
    const score = Math.max(...scores);

    const [x, y, w, h] = modelBox;
    const centerX = x / ratioX;
    const centerY = y / ratioY;
    const width = w / ratioX;
    const height = h / ratioY;
    const scaledBox = { centerX, centerY, width, height };

    const label = scores.indexOf(score);
    boxes.push({ box: scaledBox, score, label: labels[label] });
  }

  return boxes;
}

async function runInference(
  yolo: ort.InferenceSession,
  nms: ort.InferenceSession,
  tensor: ort.TypedTensor<"float32">
) {
  const nmsConfig = new Tensor(
    "float32",
    new Float32Array([topk, iouThreshold, scoreThreshold])
  );
  const { output0 } = await yolo.run({ images: tensor });
  const { selected } = await nms.run({ detection: output0, config: nmsConfig });
  return selected;
}

async function predict(canvas: HTMLCanvasElement) {
  console.log("starting inference...");
  const startTime = new Date();

  // 1. convert to tensor
  console.log("1. computing image tensor...");
  const imageTensor = await getImageTensor(canvas);
  console.log(
    `   image tensor computed in ${
      new Date().getTime() - startTime.getTime()
    } ms`
  );

  // 2. create models
  const yolo = await ort.InferenceSession.create("yolov8n.onnx");
  const nms = await ort.InferenceSession.create("nms-yolov8.onnx");
  const infStartTime = new Date();
  console.log("2. running model...");
  const inferenceResults = await runInference(yolo, nms, imageTensor);
  console.log(
    `   model ran in ${new Date().getTime() - infStartTime.getTime()} ms`
  );

  // 3. process results
  const processStartTime = new Date();
  console.log("3. processing results...");
  const canvasSize: Size = { width: canvas.width, height: canvas.height };
  const results = processResults(inferenceResults, canvasSize);
  console.log(
    `   processed results in ${
      new Date().getTime() - processStartTime.getTime()
    } ms`
  );

  // 4. return predictions
  console.log(
    `inference complete in ${new Date().getTime() - startTime.getTime()} ms`
  );
  return results;
}

const CANVAS_MAX_SIZE = 800;

function App() {
  const canvas = useRef<HTMLCanvasElement>(null!);

  const image = new Image();
  image.src = "pupper4.jpg";

  const imageToCanvasRatio =
    Math.max(image.width, image.height) / CANVAS_MAX_SIZE;

  const canvasSize: Size = {
    width: image.width / imageToCanvasRatio,
    height: image.height / imageToCanvasRatio,
  };

  const [initialized, setInitialized] = useState<boolean>(false);
  cv.onRuntimeInitialized = () => {
    setInitialized(true);
  };

  useEffect(() => {
    if (canvas.current && initialized) {
      const ctx = canvas.current.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
      predict(canvas.current).then((results) => {
        results.forEach(({ box, label }) => {
          const { centerX, centerY, width, height } = box;
          ctx.strokeStyle = "orange";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            centerX - width / 2,
            centerY - height / 2,
            width,
            height
          );

          const textPadding = 3;
          ctx.font = "bold 12px monospace";
          ctx.fillStyle = "orange";
          ctx.fillRect(
            centerX - width / 2,
            centerY + height / 2 - (12 + 2 * textPadding),
            ctx.measureText(label).width + 2 * textPadding,
            12 + 2 * textPadding
          );

          ctx.fillStyle = "white";
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          ctx.fillText(
            label,
            centerX - width / 2 + textPadding,
            centerY + height / 2 - textPadding
          );
        });
      });
    }
  }, [canvas.current, initialized]);

  return (
    <>
      <h1>Can I run YOLOv8 in my browser?</h1>
      <div>
        <p>Let's find out. </p>
      </div>
      <canvas
        ref={canvas}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </>
  );
}

export default App;
