import WebMWriter from "../deps/webm-writer2";

import WorkerIncomingMessage from "../dto/WorkerIncomingMessage";
import WorkerOutgoingMessage from "../dto/WorkerOutgoingMessage";
import MP4Demuxer from "./MP4Demuxer";
import VideoProcessor from "./VideoProcessor";
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
    bitrate: encoderConfig.bitrate,
  }),
});

self.onmessage = async ({ data }: MessageEvent<WorkerIncomingMessage>) => {
  await videoProcessorInstance.start({
    file: data.videoFile,
    encoderConfig,
    onFrame(frame) {
      const videoFrameMessage: WorkerOutgoingMessage = { videoFrame: frame, done: false };
      self.postMessage(videoFrameMessage);
    },
    onEncodedFragment(fragment) {
      const encodedFragmentData: WorkerOutgoingMessage = { videoFragment: fragment, done: false };
      self.postMessage(encodedFragmentData);
    }
  });

  const doneMessage: WorkerOutgoingMessage = { done: true };
  self.postMessage(doneMessage);
};
