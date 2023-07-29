import { useEffect, useMemo, useRef, useState } from "react";
import cv, { absdiff } from "@techstark/opencv-js";

import { Size } from "./utils/types";
import { run } from "./utils/run";
import { drawBoxes } from "./utils/graphics";
import { ModelManager } from "./utils/ModelManager";
import { TaskTimer } from "./utils/TaskTimer";
import Webcam from "react-webcam";

const CANVAS_WIDTH = 800;
// just putting this here for easier control
const USE_TIMER = true;

function App() {
  const inputCanvas = useRef<HTMLCanvasElement>(null!);
  const outputCanvas = useRef<HTMLCanvasElement>(null!);
  const webcam = useRef<Webcam>(null!);

  const timer = USE_TIMER ? useMemo(() => new TaskTimer(), []) : undefined;

  // setup cv
  const [cvReady, setCvReady] = useState<boolean>(false);
  cv.onRuntimeInitialized = () => {
    setCvReady(true);
  };

  // setup model
  const modelManager = useMemo(() => new ModelManager(), []);
  const [modelReady, setModelReady] = useState<boolean>(false);
  useEffect(() => {
    setModelReady(false);
    modelManager.init(timer).then(() => setModelReady(true));
  }, []);

  // HACK: need to figure out aspect ratio dynamically somehow
  const canvasSize: Size = {
    width: 640,
    height: 480,
  };

  const handleClear = () => {
    const inputCtx = inputCanvas.current.getContext("2d");
    inputCtx?.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const outputCtx = outputCanvas.current.getContext("2d");
    outputCtx?.clearRect(0, 0, canvasSize.width, canvasSize.height);
  };

  const handleRun = () => {
    // take a screenshot of the webcam and render it to the input canvas
    // HACK: probably don't need to convert to an image type, just ship the base64 string to the model
    const inputCtx = inputCanvas.current?.getContext("2d");
    const screenshot = webcam.current.getScreenshot();
    const image = new Image();
    image.src = screenshot ?? "";
    image.onload = () => {
      inputCtx?.drawImage(image, 0, 0);

      const outputCtx = outputCanvas.current.getContext("2d")!;
      run(inputCanvas.current, modelManager, timer).then((results) => {
        handleClear();
        drawBoxes(outputCtx, results);
      });
    };
  };

  const ready = modelReady && cvReady;

  return (
    <div className="app-container">
      <main>
        <h1>YOLOv8 + Webcam 🙌</h1>
        <div className="canvas-container" style={{ width: canvasSize.width }}>
          <Webcam
            ref={webcam}
            width={canvasSize.width}
            screenshotFormat="image/png"
            style={{ zIndex: 0 }}
          />
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
        <div className="buttons">
          <button type="button" disabled={!ready} onClick={handleRun}>
            Run Model
          </button>
          <button type="button" onClick={handleClear}>
            Clear Output
          </button>
        </div>{" "}
      </main>
    </div>
  );
}

export default App;
