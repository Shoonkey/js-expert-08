
import EncodedFragment from "./dto/EncodedFragment";
import WorkerIncomingMessage from "./dto/WorkerIncomingMessage";
import WorkerOutgoingMessage from "./dto/WorkerOutgoingMessage";

interface ProcessVideoProps {
  videoFile: File;
  onStart: () => void;
  onFrame: (frame: VideoFrame) => void;
  onEncodedFragment: (data: EncodedFragment) => Promise<void>;
  onFinish: () => void;
}

interface UploadFileProps {
  filename: string;
  fileBuffer: Blob;
}

class Service {
  private _serverURL: string = "http://localhost:3000";

  async processVideoInBackground({
    videoFile,
    onStart,
    onFrame,
    onEncodedFragment,
    onFinish,
  }: ProcessVideoProps) {
    const worker = new Worker("./src/worker", { type: "module" });

    worker.onmessage = async ({ data }: MessageEvent<WorkerOutgoingMessage>) => {
      if (data.done) {
        onFinish();
        return;
      }

      if (data.videoFrame) {
        onFrame(data.videoFrame);
        return;
      }

      if (data.videoFragment) {
        await onEncodedFragment(data.videoFragment);
        return;
      }
    };

    worker.onerror = (err) => console.error("Error on worker", err);

    const data: WorkerIncomingMessage = { videoFile };
    worker.postMessage(data);

    onStart();
  }

  async uploadFile({ filename, fileBuffer }: UploadFileProps) {
    const formData = new FormData();
    formData.append(filename, fileBuffer);

    const response = await fetch(this._serverURL, {
      method: "POST",
      body: formData,
    });

    console.assert(response.ok, "response is not ok", response);
    return response;
  }
}

export default new Service();
