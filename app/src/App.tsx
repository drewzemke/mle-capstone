import { useEffect, useMemo, useRef, useState } from "react";
import cv from "@techstark/opencv-js";

import { Size } from "./utils/types";
import { run } from "./utils/run";
import { drawBoxes } from "./utils/graphics";
import { ModelManager } from "./utils/ModelManager";
import { TaskTimer } from "./utils/TaskTimer";

const CANVAS_MAX_SIZE = 800;

function App() {
  const inputCanvas = useRef<HTMLCanvasElement>(null!);
  const outputCanvas = useRef<HTMLCanvasElement>(null!);

  const image = new Image();
  image.src = "pupper4.jpg";

  const imageToCanvasRatio = Math.max(image.width, image.height) / CANVAS_MAX_SIZE;

  const canvasSize: Size = {
    width: image.width / imageToCanvasRatio,
    height: image.height / imageToCanvasRatio,
  };

  const [cvReady, setCvReady] = useState<boolean>(false);
  cv.onRuntimeInitialized = () => {
    setCvReady(true);
  };

  const timer = useMemo(() => new TaskTimer(), []);

  const modelManager = useMemo(() => new ModelManager(), []);
  const [modelReady, setModelReady] = useState<boolean>(false);
  useEffect(() => {
    setModelReady(false);
    modelManager.init(timer).then(() => setModelReady(true));
  }, []);

  useEffect(() => {
    const ctx = inputCanvas.current?.getContext("2d");
    ctx?.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
  }, [inputCanvas.current]);

  useEffect(() => {
    if (outputCanvas.current && cvReady && modelReady) {
      const ctx = outputCanvas.current.getContext("2d");
      if (!ctx) {
        return;
      }

      run(inputCanvas.current, modelManager, timer).then((results) => drawBoxes(ctx, results));
    }
  }, [inputCanvas.current, outputCanvas.current, cvReady, modelReady]);

  return (
    <main>
      <h1>YOLOv8 in-browser demo</h1>
      <div
        className="canvas-container"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <canvas
          ref={inputCanvas}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ zIndex: 1 }}
        />
        <canvas
          ref={outputCanvas}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ zIndex: 2 }}
        />
      </div>
    </main>
  );
}

export default App;
