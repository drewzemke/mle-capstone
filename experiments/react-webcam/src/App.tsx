import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

import "./App.css";

const TIMEOUT_MS = 200;

function App() {
  const webcam = useRef<Webcam>(null!);
  const canvas = useRef<HTMLCanvasElement>(null!);

  const [screenshot, setScreenshot] = useState<string>();
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const takeScreenshot = useCallback(() => {
    const image = webcam.current.getScreenshot();
    setScreenshot(image ?? "");
  }, [webcam]);

  const toggleRecordFrames = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    } else {
      const intervalId = setInterval(() => {
        const screenshot = webcam.current.getScreenshot();
        const image = new Image();
        image.src = screenshot ?? "";

        const ctx = canvas.current.getContext("2d");
        image.onload = () => {
          ctx?.drawImage(image, 0, 0, 400, 300);
        };
      }, TIMEOUT_MS);
      setIntervalId(intervalId);
    }
  };

  return (
    <>
      <h1>React Webcam Test</h1>
      <button onClick={takeScreenshot}>Take a Screenshot</button>
      <button onClick={toggleRecordFrames}>Toggle Record Frames</button>
      <p>Hey look, a webcam:</p>
      <Webcam ref={webcam} width={400} screenshotFormat="image/jpeg" />
      {screenshot && !intervalId && (
        <>
          <p>Here's your latest screenshot :</p> <img src={screenshot} />
        </>
      )}
      {intervalId && (
        <>
          <p>{`Look I'm recording frames for you, every ${TIMEOUT_MS} milliseconds:`}</p>{" "}
          <canvas ref={canvas} width={400} height={300} />
        </>
      )}
    </>
  );
}

export default App;
