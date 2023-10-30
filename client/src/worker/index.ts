import WebMWriter from "../deps/webm-writer2";

import IncomingMessage from "./dto/IncomingMessage";
import MP4Demuxer from "./MP4Demuxer";
import VideoProcessor from "./VideoProcessor";
import CanvasRenderer from "./CanvasRenderer";
import { RESOLUTIONS, getVideoEncoderConfig } from "./config";

const encoderConfig = getVideoEncoderConfig({
  format: "webm",
  resolution: RESOLUTIONS.QVGA,
});

const videoProcessorInstance = new VideoProcessor({
  mp4Demuxer: MP4Demuxer,
  webMWriter: new WebMWriter({
    codec: "VP9",
    width: encoderConfig.width,
    height: encoderConfig.height,
    bitrate: encoderConfig.bitrate
  }),
});

self.onmessage = async ({ data }: MessageEvent<IncomingMessage>) => {
  await videoProcessorInstance.start({
    file: data.videoFile,
    canvas: data.canvas,
    encoderConfig,
    onFrame: new CanvasRenderer(data.canvas).getRenderer(),
    onMessage: (message) => self.postMessage(message),
  });
};
