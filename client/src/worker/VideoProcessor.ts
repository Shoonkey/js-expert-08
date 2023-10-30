import MP4Demuxer from "./MP4Demuxer";
import OutgoingMessage from "./dto/OutgoingMessage";

interface StartVideoProcessingProps {
  file: File;
  canvas: OffscreenCanvas;
  encoderConfig: VideoEncoderConfig;
  onFrame: (frame: VideoFrame) => void;
  onMessage: (message: OutgoingMessage) => void;
}

interface DecodeMP4Props {
  encoderConfig: VideoEncoderConfig;
  fileStream: ReadableStream;
}

class VideoProcessor {
  _mp4Demuxer: typeof MP4Demuxer;

  constructor({ mp4Demuxer }: { mp4Demuxer: typeof MP4Demuxer }) {
    this._mp4Demuxer = mp4Demuxer;
  }

  decodeMP4({ encoderConfig, fileStream }: DecodeMP4Props) {
    return new ReadableStream({
      start: (controller) => {
        const decoder = new VideoDecoder({
          output(frame) {
            controller.enqueue(frame);
          },
          error(err) {
            console.error("Error at video decoder:", err);
            controller.error(err);
          },
        });

        return this._mp4Demuxer
          .run(fileStream, {
            onConfig(config) {
              decoder.configure(config);
            },
            onChunk(chunk) {
              decoder.decode(chunk);
            },
          })
          .then(() => setTimeout(() => controller.close(), 3000));
      },
    });
  }

  async start({
    file,
    encoderConfig,
    onFrame,
    onMessage,
  }: StartVideoProcessingProps) {
    const fileStream = file.stream();
    const fileName = file.name.split("/").pop()!.replace(".mp4", "");

    const decodeStream = this.decodeMP4({ encoderConfig, fileStream });
    const consumeFrames = new WritableStream<VideoFrame>({
      write(frame) {
        onFrame(frame);
      },
    });

    return decodeStream.pipeTo(consumeFrames);
  }
}

export default VideoProcessor;
