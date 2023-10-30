import WebMWriter from "../deps/webm-writer2";
import MP4Demuxer from "./MP4Demuxer";
import OutgoingMessage from "./dto/OutgoingMessage";
import Service from "./service";

interface StartVideoProcessingProps {
  file: File;
  canvas: OffscreenCanvas;
  encoderConfig: VideoEncoderConfig;
  onFrame: (frame: VideoFrame) => void;
  onMessage: (message: OutgoingMessage) => void;
}

interface DecodeChunkConfigChunk {
  type: "config";
  config: VideoDecoderConfig;
}

class VideoProcessor {
  _mp4Demuxer: typeof MP4Demuxer;
  _webMWriter: typeof WebMWriter;
  _service: Service;

  constructor({
    mp4Demuxer,
    webMWriter,
    service,
  }: {
    mp4Demuxer: typeof MP4Demuxer;
    webMWriter: typeof WebMWriter;
    service: Service;
  }) {
    this._mp4Demuxer = mp4Demuxer;
    this._webMWriter = webMWriter;
    this._service = service;
  }

  decodeMP4(fileStream: ReadableStream) {
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
        frame.close();
      },
    });

    return {
      readable,
      writable,
    };
  }

  renderDecodedFramesAndGetEncodedChunks(
    onFrame: StartVideoProcessingProps["onFrame"]
  ) {
    let _decoder: VideoDecoder;
    return new TransformStream<EncodedVideoChunk | DecodeChunkConfigChunk>({
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

        // need the encoded version to use webM
        controller.enqueue(encodedChunk);
      },
    });
  }

  transformIntoWebM() {
    const writable = new WritableStream({
      write: (chunk) => {
        this._webMWriter.addFrame(chunk);
      },
      close() {
        debugger;
      },
    });
    return {
      readable: this._webMWriter.getStream(),
      writable,
    };
  }

  upload(filename: string, resolution: string, type: string) {
    const chunks: any[] = [];
    let byteCount = 0;
    let segmentCount = 0;
    const triggerUpload = async (chunks: any) => {
      const blob = new Blob(chunks, { type: "video/webm" });

      // fazer upload
      await this._service.uploadFile({
        filename: `${filename}-${resolution}.${++segmentCount}.${type}`,
        fileBuffer: blob,
      });
      // vai remover todos os elementos
      chunks.length = 0;
      byteCount = 0;
    };

    return new WritableStream({
      async write({ data }) {
        chunks.push(data);
        byteCount += data.byteLength;
        // se for menor que 10mb não faz upload!
        if (byteCount <= 10e6) return;
        await triggerUpload(chunks);
        // renderFrame(frame)
      },
      async close() {
        if (!chunks.length) return;
        await triggerUpload(chunks);
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

    const decodeStream = this.decodeMP4(fileStream);
    // const consumeFrames = new WritableStream<VideoFrame>({
    //   write(frame) {
    //     onFrame(frame);
    //   },
    // });

    // const _buffers: any[] = [];

    await decodeStream
      .pipeThrough(this._encode144p(encoderConfig))
      .pipeThrough(this.renderDecodedFramesAndGetEncodedChunks(onFrame))
      .pipeThrough(this.transformIntoWebM())
      // .pipeThrough(
      //   new TransformStream({
      //     transform: ({ data }: any, controller) => {
      //       _buffers.push(data);
      //       controller.enqueue(data);
      //     },
      //     flush: () => {
      //       onMessage({
      //         done: true,
      //         buffers: _buffers,
      //         filename: fileName.concat("-144p.webm"),
      //       });
      //     },
      //   })
      // )
      .pipeTo(this.upload(fileName, "144p", "webm"));
      // .pipeTo(consumeFrames)
    
    onMessage({ done: true });
  }
}

export default VideoProcessor;
