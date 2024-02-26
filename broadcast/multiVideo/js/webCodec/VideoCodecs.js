const videoCodec = {
  jpeg: "jpeg",
  png: "png",
  h264: "avc1.42002A",
  vp8: "vp8",
  vp9: "vp09.00.31.08",
  av1: "av01.0.08M.10.0.110.09",
  h265: "hvc1.1.6.L123.00",
};

const encoderConfig = {
  "2160p": {
    width: 3840,
    height: 2160,
    displayWidth: 3840,
    displayHeight: 2160,
    bitrate: 34_000_000,
    bitrateMode: "constant",
    framerate: 24,
    latencyMode: "realtime",
  },
  "1440p": {
    width: 2560,
    height: 1440,
    displayWidth: 2560,
    displayHeight: 1440,
    bitrate: 13_000_000,
    bitrateMode: "constant",
    framerate: 24,
    latencyMode: "realtime",
  },
  "1080p": {
    width: 1920,
    height: 1080,
    displayWidth: 1920,
    displayHeight: 1080,
    bitrate: 6_000_000,
    bitrateMode: "constant",
    framerate: 24,
    latencyMode: "realtime",
  },
  "720p": {
    width: 1280,
    height: 720,
    displayWidth: 1280,
    displayHeight: 720,
    bitrate: 4_000_000,
    bitrateMode: "constant",
    framerate: 24,
    latencyMode: "realtime",
  },
  "480p": {
    width: 640,
    height: 480,
    displayWidth: 640,
    displayHeight: 480,
    bitrate: 2_000_000,
    bitrateMode: "constant",
    framerate: 24,
    latencyMode: "realtime",
  },
};

const getVideoEncoderConfig = (codec, resolution) => {
  if (codec === "jpeg" || codec === "png") {
    return codec;
  }

  const config = encoderConfig[resolution];

  config.codec = videoCodec[codec];
  if (codec === "h264") {
    config.avc = { format: "annexb" };
  } else if (codec === "h265") {
    config.hevc = { format: "annexb" };
  }

  return config;
};
