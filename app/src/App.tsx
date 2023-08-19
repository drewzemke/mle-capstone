import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cv from "@techstark/opencv-js";

import { Size } from "./utils/types";
import { run } from "./utils/run";
import { drawFps, drawLetterProbs } from "./utils/graphics";
import { ModelManager } from "./utils/ModelManager";
import { TaskTimer } from "./utils/TaskTimer";
import Webcam from "react-webcam";

// just putting this here for easier control
const USE_TIMER = true;

// the widest the canvas will get on wide screens
const MAX_CANVAS_WIDTH_PX = 640;

function App() {
  const inputCanvas = useRef<HTMLCanvasElement>(null!);
  const outputCanvas = useRef<HTMLCanvasElement>(null!);
  const webcam = useRef<Webcam>(null!);

  const [webcamSize, setWebcamSize] = useState<Size>();

  const timer = useMemo(() => (USE_TIMER ? new TaskTimer() : undefined), []);

  const animRequestRef = useRef<number>();
  const animStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

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
    modelManager
      .init(timer)
      .then(() => setModelReady(true))
      .catch(() => {
        console.error("Could not initialize model.");
      });
  }, [modelManager, timer]);

  const canvasSize: Size = useMemo(() => {
    if (!webcamSize) {
      return { width: 0, height: 0 };
    }

    const maxWidth = Math.min(0.9 * window.innerWidth, MAX_CANVAS_WIDTH_PX);
    const maxHeight = 0.7 * window.innerHeight;
    const widthScalingFactor = maxWidth / webcamSize.width;
    const heightScalingFactor = maxHeight / webcamSize.height;

    // use whichever scaling factor is smaller
    let width: number;
    let height: number;
    if (widthScalingFactor < heightScalingFactor) {
      width = maxWidth;
      height = webcamSize.height * widthScalingFactor;
    } else {
      height = maxHeight;
      width = webcamSize.width * heightScalingFactor;
    }

    return { width, height };
  }, [webcamSize]);


  const handleClear = useCallback(() => {
    const inputCtx = inputCanvas.current.getContext("2d");
    inputCtx?.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const outputCtx = outputCanvas.current.getContext("2d");
    outputCtx?.clearRect(0, 0, canvasSize.width, canvasSize.height);
  }, [canvasSize]);

  const [running, setRunning] = useState(false);

  const runModel = useCallback(() => {
    // calculate fps
    renderCount.current++;
    const fps = (1000 * renderCount.current) / (Date.now() - animStartTime.current);

    // take a screenshot of the webcam and render it to the input canvas
    // TODO: try just using webcam.current.getCanvas() instead?
    const inputCtx = inputCanvas.current?.getContext("2d");
    const screenshot = webcam.current.getScreenshot();
    const image = new Image();
    image.src = screenshot ?? "";
    image.onload = () => {
      inputCtx?.drawImage(image, 0, 0);

      const outputCtx = outputCanvas.current.getContext("2d")!;
      run(inputCanvas.current, modelManager, timer)
        .then((results) => {
          handleClear();
          drawLetterProbs(outputCtx, results);
          drawFps(outputCtx, fps);
        })
        .catch(() => console.error("Encountered an error while running the model."));
    };

    if (running) {
      animRequestRef.current = requestAnimationFrame(runModel);
    }
  }, [handleClear, modelManager, running, timer]);

  const ready = modelReady && cvReady && webcamSize;

  useEffect(() => {
    if (!running) {
      if (animRequestRef.current) {
        cancelAnimationFrame(animRequestRef.current);
      }
    } else {
      animRequestRef.current = requestAnimationFrame(runModel);
      return () => {
        animRequestRef.current && cancelAnimationFrame(animRequestRef.current);
      };
    }
  }, [runModel, running]);

  const toggleRunning = () => {
    if (running) {
      console.log("Stopping model.");
      setRunning(false);
    } else {
      console.log("Starting model.");
      animStartTime.current = Date.now();
      renderCount.current = 0;
      setRunning(true);
    }
  };

  return (
    <div className="app-container">
      <main>
        <h1>ASL Fingerspelling</h1>
        <div
          className="canvas-container"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            border: running ? "1px solid #535bf2" : "1px solid gray",
            transition: "200ms",
            visibility: webcamSize ? "visible" : "hidden",
          }}
        >
          <Webcam
            ref={webcam}
            screenshotFormat="image/png"
            width={canvasSize.width}
            height={canvasSize.height}
            onUserMedia={(stream) => {
              const settings = stream
                .getVideoTracks()
                .find((track) => track.kind === "video")
                ?.getSettings();
              if (settings?.width && settings.height) {
                setWebcamSize({ width: settings.width, height: settings.height });
              }
            }}
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
        {!ready && <p>Loading webcam stream and ML models...</p>}
        {ready && (
          <div>
            <p>{`Window: ${window.innerWidth} x ${window.innerHeight}`}</p>
            <p>{`Webcam: ${webcamSize.width} x ${webcamSize.height}`}</p>
            <p>{`Canvas: ${canvasSize.width} x ${canvasSize.height}`}</p>
          </div>
        )}
        <div className="buttons">
          <button type="button" disabled={!ready} onClick={toggleRunning}>
            {`${running ? "Stop" : "Start"} Model`}
          </button>
          <button type="button" onClick={handleClear}>
            Clear Output
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
