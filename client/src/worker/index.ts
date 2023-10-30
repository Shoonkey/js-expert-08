import IncomingMessage from "./dto/IncomingMessage";
import MP4Demuxer from "./MP4Demuxer";
import VideoProcessor from "./VideoProcessor";
import CanvasRenderer from "./CanvasRenderer";
import { RESOLUTIONS, getVideoEncoderConfig } from "./config";

const videoProcessorInstance = new VideoProcessor({ mp4Demuxer: MP4Demuxer });

self.onmessage = async ({ data }: MessageEvent<IncomingMessage>) => {
  await videoProcessorInstance.start({
    file: data.videoFile,
    canvas: data.canvas,
    encoderConfig: getVideoEncoderConfig({
      format: "webm",
      resolution: RESOLUTIONS.QVGA,
    }),
    onFrame: new CanvasRenderer(data.canvas).getRenderer(),
    onMessage: (message) => self.postMessage(message)
  });

  self.postMessage({ done: true });
};
