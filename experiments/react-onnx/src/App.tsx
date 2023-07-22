import { useEffect, useMemo, useRef, useState } from "react";
import cv from "@techstark/opencv-js";

import "./App.css";
import { Size } from "./utils/types";
import { run } from "./utils/run";
import { drawBoxes } from "./utils/graphics";
import { ModelManager } from "./utils/ModelManager";

const CANVAS_MAX_SIZE = 800;

function App() {
  const canvas = useRef<HTMLCanvasElement>(null!);

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

  const modelManager = useMemo(() => new ModelManager(), []);
  const [modelReady, setModelReady] = useState<boolean>(false);
  useEffect(() => {
    modelManager.init().then(() => setModelReady(true));
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    ctx?.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
  }, [canvas.current]);

  useEffect(() => {
    if (canvas.current && cvReady && modelReady) {
      const ctx = canvas.current.getContext("2d");
      if (!ctx) {
        return;
      }

      run(canvas.current, modelManager).then((results) => drawBoxes(ctx, results));
    }
  }, [canvas.current, cvReady, modelReady]);

  return (
    <>
      <h1>Can I run YOLOv8 in my browser?</h1>
      <div>
        <p>Let's find out. </p>
      </div>
      <canvas ref={canvas} width={canvasSize.width} height={canvasSize.height} />
    </>
  );
}

export default App;
