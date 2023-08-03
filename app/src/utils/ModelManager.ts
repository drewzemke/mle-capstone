import { InferenceSession, TypedTensor } from "onnxruntime-web";
import { TaskTimer } from "./TaskTimer";

// the size of the (square) image expected by the model
const MODEL_SIZE = 320;

export class ModelManager {
  private yolo: InferenceSession | undefined;
  // private nmsConfig: Tensor;
  modelSize: number;

  constructor() {
    this.modelSize = MODEL_SIZE;
  }

  async init(timer?: TaskTimer) {
    if (!this.yolo) {
      timer?.start("load models");
      this.yolo = await InferenceSession.create("fingerspelling.onnx");
      timer?.finish("load models");
    }
  }

  async execute(tensor: TypedTensor<"float32">, timer?: TaskTimer) {
    if (!this.yolo) {
      throw new Error("Models were used before being initialized");
    }

    timer?.start("yolo");
    const { output0 } = await this.yolo.run({ images: tensor });
    timer?.finish("yolo");

    return output0;
  }
}
