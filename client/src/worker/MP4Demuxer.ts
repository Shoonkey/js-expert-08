import mp4box from "mp4box";

interface DemuxerOptions {
  onConfig: (config: any) => void;
  onChunk: (chunk: any) => void;
}

const NO_OP = () => {};

class MP4Demuxer {
  private _file: any;
  private _onConfig: DemuxerOptions["onConfig"] = NO_OP;
  private _onChunk: DemuxerOptions["onChunk"] = NO_OP;

  private _init(stream: ReadableStream) {
    let _offset = 0;

    const consumeFileStream = new WritableStream<Uint8Array>({
      write: (chunk) => {
        const copy = chunk.buffer;
        Object.defineProperty(copy, "fileStart", {
          value: _offset,
          writable: false,
        });
        this._file.appendBuffer(copy);
        _offset += chunk.length;
      },
      close: () => {
        this._file.flush();
      },
    });

    return stream.pipeTo(consumeFileStream);
  }

  private _onReady(args: any) {
    const [track] = args.videoTracks;

    this._onConfig({ 
      codec: track.codec,
      codedWidth: track.video.width,
      codedHeight: track.video.height,
      description: this._getTrackDescription(track.id),
      durationSecs: args.duration / args.timescale
    });

    this._file.setExtractionOptions(track.id);
    this._file.start();
  }

  private _onSamples(trackId: number, ref: any, samples: any) {
    for (const sample of samples) {
      const chunk = new EncodedVideoChunk({
          type: sample.is_sync ? "key" : "delta",
          timestamp: 1e6 * sample.cts / sample.timescale,
          duration: 1e6 * sample.duration / sample.timescale,
          data: sample.data
      });

      this._onChunk(chunk);
  }
  }

  private _onError(err: Error) {
    console.error("Error on demuxer:", err);
  }

  _getTrackDescription(trackId: number) {
    const track = this._file.getTrackById(trackId);

    for (const entry of track.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new mp4box.DataStream(undefined, 0, mp4box.DataStream.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8);  // Remove the box header.
      }
    }

    throw new Error("avcC, hvcC, vpcC, or av1C box not found");
}

  async run(fileStream: ReadableStream, { onConfig, onChunk }: DemuxerOptions) {
    this._onConfig = onConfig;
    this._onChunk = onChunk;

    this._file = mp4box.createFile();

    this._file.onReady = this._onReady.bind(this);
    this._file.onSamples = this._onSamples.bind(this);
    this._file.onError = this._onError.bind(this);

    this._init(fileStream);
  }
}

export default new MP4Demuxer();
