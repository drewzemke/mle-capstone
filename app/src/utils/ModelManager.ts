import { InferenceSession, Tensor, TypedTensor } from "onnxruntime-web";
import { TaskTimer } from "./TaskTimer";

// nms settings:
// preserve the top k instances of each class
const TOP_K = 100;

// intersection over union threshold -- boxes with a smaller IOU will be discarded
const IOU_THRESHOLD = 0.45;

// also discard boxes with small scores
const SCORE_THRESHOLD = 0.25;

// the size of the (square) image expected by the model
const MODEL_SIZE = 256;

export class ModelManager {
  private yolo: InferenceSession | undefined;
  private nms: InferenceSession | undefined;
  private nmsConfig: Tensor;
  modelSize: number;

  constructor() {
    this.modelSize = MODEL_SIZE;
    this.nmsConfig = new Tensor(
      "float32",
      new Float32Array([TOP_K, IOU_THRESHOLD, SCORE_THRESHOLD])
    );
  }

  async init(timer: TaskTimer) {
    if (!this.yolo || !this.nms) {
      timer.start("load models");
      this.yolo = await InferenceSession.create("yolov8n.onnx");
      this.nms = await InferenceSession.create("nms-yolov8.onnx");
      timer.finish("load models");
    }
  }

  async execute(tensor: TypedTensor<"float32">, timer: TaskTimer) {
    if (!this.yolo || !this.nms) {
      throw new Error("Models were used before being initialized");
    }

    timer.start("yolo");
    const { output0 } = await this.yolo.run({ images: tensor });
    timer.finish("yolo");

    timer.start("nms");
    const { selected } = await this.nms.run({ detection: output0, config: this.nmsConfig });
    timer.finish("nms");

    return selected;
  }
}
