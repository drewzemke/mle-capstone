import { InferenceSession, Tensor, TypedTensor } from "onnxruntime-web";

// nms settings:
// preserve the top k instances of each class
const topk = 100;

// intersection over union threshold -- boxes with a smaller IOU will be discarded
const iouThreshold = 0.45;

// also discard boxes with small scores
const scoreThreshold = 0.25;

export class ModelManager {
  private yolo: InferenceSession | undefined;
  private nms: InferenceSession | undefined;
  modelSize: number;

  constructor() {
    this.modelSize = 640;
  }

  async init() {
    if (!this.yolo || !this.nms) {
      console.log("loading models...");

      const loadStartTime = new Date();
      this.yolo = await InferenceSession.create("yolov8n.onnx");
      this.nms = await InferenceSession.create("nms-yolov8.onnx");
      console.log(`models loaded in ${new Date().getTime() - loadStartTime.getTime()} ms`);
    }
  }

  async execute(tensor: TypedTensor<"float32">) {
    if (!this.yolo || !this.nms) {
      throw new Error("Models were used before being initialized");
    }

    const nmsConfig = new Tensor("float32", new Float32Array([topk, iouThreshold, scoreThreshold]));

    console.log("   2a. running yolo...");
    const yoloStartTime = new Date();
    const { output0 } = await this.yolo.run({ images: tensor });
    console.log(`       yolo ran in ${new Date().getTime() - yoloStartTime.getTime()} ms`);

    console.log("   2b. running nms...");
    const nmsStartTime = new Date();
    const { selected } = await this.nms.run({ detection: output0, config: nmsConfig });
    console.log(`       nms ran in ${new Date().getTime() - nmsStartTime.getTime()} ms`);

    return selected;
  }
}
