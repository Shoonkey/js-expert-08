import WebMWriter from "../deps/webm-writer2";
import EncodedFragment from "../dto/EncodedFragment";
import MP4Demuxer from "./MP4Demuxer";

interface StartVideoProcessingProps {
  file: File;
  encoderConfig: VideoEncoderConfig;
  onFrame: (frame: VideoFrame) => void;
  onEncodedFragment: (data: EncodedFragment) => void;
}

interface DecodeChunkConfigChunk {
  type: "config";
  config: VideoDecoderConfig;
}

class VideoProcessor {
  private _mp4Demuxer: typeof MP4Demuxer;
  private _webMWriter: typeof WebMWriter;

  constructor({
    mp4Demuxer,
    webMWriter,
  }: {
    mp4Demuxer: typeof MP4Demuxer;
    webMWriter: typeof WebMWriter;
  }) {
    this._mp4Demuxer = mp4Demuxer;
    this._webMWriter = webMWriter;
  }

  private _decodeMP4(fileStream: ReadableStream<Uint8Array>) {
    return new ReadableStream<VideoFrame>({
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

        return this._mp4Demuxer.run(fileStream, {
          async onConfig(config) {
            const { supported } = await VideoDecoder.isConfigSupported(config);

            if (!supported) {
              console.error(
                "VideoDecoder config not supported! Attemped config:",
                config
              );
              controller.close();
              return;
            }

            decoder.configure(config);
          },
          onChunk(chunk) {
            decoder.decode(chunk);
          },
        });
      },
    });
  }

  private _encode144p(encoderConfig: VideoEncoderConfig) {
    let _encoder: VideoEncoder;

    const readable = new ReadableStream<
      EncodedVideoChunk | DecodeChunkConfigChunk
    >({
      start: async (controller) => {
        const { supported } = await VideoEncoder.isConfigSupported(
          encoderConfig
        );

        if (!supported) {
          const message = "encode144p VideoEncoder config not supported!";
          console.error(message, "Attemped config:", encoderConfig);
          controller.error(message);
          return;
        }

        _encoder = new VideoEncoder({
          output: (chunk, config) => {
            if (config?.decoderConfig) {
              const decoderConfig: DecodeChunkConfigChunk = {
                type: "config",
                config: config.decoderConfig,
              };

              controller.enqueue(decoderConfig);
            }
            controller.enqueue(chunk);
          },
          error: (err) => {
            console.error("VideoEncoder 144p error", err);
            controller.error(err);
          },
        });

        await _encoder.configure(encoderConfig);
      },
    });

    const writable = new WritableStream<VideoFrame>({
      async write(frame) {
        _encoder.encode(frame);
      },
    });

    return {
      readable,
      writable,
    };
  }

  private _renderDecodedFramesAndGetEncodedChunks(
    onFrame: (frame: VideoFrame) => void
  ) {
    let _decoder: VideoDecoder;
    return new TransformStream<
      EncodedVideoChunk | DecodeChunkConfigChunk,
      EncodedVideoChunk
    >({
      start: (controller) => {
        _decoder = new VideoDecoder({
          output(frame) {
            onFrame(frame);
          },
          error(e) {
            console.error("error at renderFrames", e);
            controller.error(e);
          },
        });
      },

      async transform(encodedChunk, controller) {
        if (encodedChunk.type === "config") {
          await _decoder.configure(encodedChunk.config);
          return;
        }

        _decoder.decode(encodedChunk);
        controller.enqueue(encodedChunk);
      },
    });
  }

  private _transformIntoWebM(): TransformStream<EncodedVideoChunk, any> {
    return {
      readable: this._webMWriter.getStream(),
      writable: new WritableStream({
        write: (chunk) => {
          this._webMWriter.addFrame(chunk);
        },
      }),
    };
  }

  private _getVideoFragments(onEncodedFragment: StartVideoProcessingProps["onEncodedFragment"]) {
    const chunks: any[] = [];
    let byteCount = 0;
    let segmentCount = 0;

    const triggerUpload = async (chunks: any) => {
      const blob = new Blob(chunks, { type: "video/webm" });

      await onEncodedFragment({
        fragment: blob,
        type: "webm",
        segmentNumber: segmentCount
      });

      segmentCount++;
    };

    return new WritableStream({
      async write({ data }) {
        chunks.push(data);
        byteCount += data.byteLength;

        if (byteCount <= 10e6) return;

        await triggerUpload(chunks);
        chunks.length = 0;
        byteCount = 0;
      },
      async close() {
        if (chunks.length === 0) return;
        await triggerUpload(chunks);
      },
    });
  }

  async start({ file, encoderConfig, onFrame, onEncodedFragment }: StartVideoProcessingProps) {
    const fileStream = file.stream();
    
    await this._decodeMP4(fileStream)
      .pipeThrough(this._encode144p(encoderConfig))
      .pipeThrough(
        this._renderDecodedFramesAndGetEncodedChunks((frame) => {
          onFrame(frame);
          frame.close();
        })
      )
      .pipeThrough(this._transformIntoWebM())
      .pipeTo(this._getVideoFragments(onEncodedFragment));
  }
}

export default VideoProcessor;
