type ResolutionType = "QVGA" | "VGA" | "HD";

interface ResolutionData {
  width: number;
  height: number;
}

interface GetVideoEncoderConfigProps {
  format: "webm" | "mp4";
  resolution: ResolutionData;
}

export const RESOLUTIONS: Record<ResolutionType, ResolutionData> = {
  QVGA: {
    width: 320,
    height: 240,
  },
  VGA: {
    width: 640,
    height: 480,
  },
  HD: {
    width: 1280,
    height: 720,
  },
};

export function getVideoEncoderConfig({
  format,
  resolution,
}: GetVideoEncoderConfigProps): VideoEncoderConfig {
  if (format === "mp4") {
    return {
      ...resolution,
      codec: "avc1.42002A",
      hardwareAcceleration: "prefer-hardware",
      avc: { format: "annexb" },
    };
  }

  // format === "webm"
  return {
    ...resolution,
    codec: "vp09.00.10.08",
    hardwareAcceleration: "prefer-software",
    bitrate: 10e6,
  };
}
