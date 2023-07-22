import { useEffect, useRef, useState } from "react";
import cv from "@techstark/opencv-js";
import * as ort from "onnxruntime-web";
import "./App.css";
import { Tensor } from "onnxruntime-web";
import { labels } from "./labels";

// TODO: learn more about what these mean...
const modelInputShape = [1, 3, 640, 640];
const topk = 100;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;
const numClasses = labels.length;

async function getImageTensor(canvas: HTMLCanvasElement) {
  // 1. load and preprocess the image
  const imgMat = cv.imread(canvas);
  const mat = new cv.Mat(imgMat.rows, imgMat.cols, cv.CV_8UC3);
  cv.cvtColor(imgMat, mat, cv.COLOR_RGBA2BGR);
  cv.resize(mat, mat, new cv.Size(640, 640));
  const input = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(640, 640),
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

function processResults(output: ort.Tensor) {
  const whatDoTheseBoxesMean = [];
  for (let index = 0; index < output.dims[1]; index++) {
    const row = output.data.slice(
      index * output.dims[2],
      (index + 1) * output.dims[2]
    ) as Float32Array;
    const box = row.slice(0, 4);
    const scores = row.slice(4, 4 + numClasses);
    const score = Math.max(...scores);

    const label = scores.indexOf(score);
    whatDoTheseBoxesMean.push({ box, score, label: labels[label] });
  }

  return whatDoTheseBoxesMean;
}

async function runInference(
  yolo: ort.InferenceSession,
  nms: ort.InferenceSession,
  tensor: ort.TypedTensor<"float32">
) {
  const config = new Tensor(
    "float32",
    new Float32Array([topk, iouThreshold, scoreThreshold])
  );
  const { output0 } = await yolo.run({ images: tensor });
  const result = await nms.run({ detection: output0, config });
  return result;
}

async function predict(canvas: HTMLCanvasElement) {
  // 1. convert to tensor
  const imageTensor = await getImageTensor(canvas);

  // 2. create models
  const yolo = await ort.InferenceSession.create("yolov8n.onnx");
  const nms = await ort.InferenceSession.create("nms-yolov8.onnx");

  // 3. process results
  const { selected } = await runInference(yolo, nms, imageTensor);
  const results = processResults(selected);

  // 4. return predictions
  return results;
}

function App() {
  const canvas = useRef<HTMLCanvasElement>(null!);

  const image = new Image();
  image.src = "pupper.png";

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

      ctx.drawImage(image, 0, 0, 640, 640);
      predict(canvas.current).then((results) => {
        results.forEach(({ box, label }) => {
          console.log(box);
          console.log(label);
          const [x, y, w, h] = [box[0], box[1], box[2], box[3]];
          ctx.strokeStyle = "green";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - w / 2, y - h / 2, w, h);
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
      <canvas ref={canvas} width={640} height={640} />
    </>
  );
}

export default App;
