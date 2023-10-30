import IncomingMessage from "./worker/dto/IncomingMessage";
import OutgoingMessage from "./worker/dto/OutgoingMessage";

interface ProcessVideoProps {
  videoFile: File;
  canvas: OffscreenCanvas;
  onStart: () => void;
  onFrame: (frame: VideoFrame) => void;
  onFinish: () => void;
}

class Service {
  async processVideoInBackground({
    videoFile,
    canvas,
    onStart,
    onFinish,
  }: ProcessVideoProps) {
    const worker = new Worker("./src/worker", { type: "module" });

    worker.onmessage = ({ data }: MessageEvent<OutgoingMessage>) => {
      if (!data.done)
        return;
      
      onFinish();
    };

    worker.onerror = (err) => console.error("Error on worker", err);

    const data: IncomingMessage = { videoFile, canvas }; 
    worker.postMessage(data, [canvas]);
    
    onStart();
  }
}

export default new Service();
