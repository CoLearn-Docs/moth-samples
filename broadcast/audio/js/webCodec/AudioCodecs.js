const audioWebCodecsMap = {
  aac: "mp4a.40.2",
  opus: "opus",
};

const encoderConfig = {
  numberOfChannels: 1,
  sampleRate: 48000,
  bitrate: 64000,
};

const getAudioEncoderConfig = (codec) => {
  const config = { ...encoderConfig };

  config.codec = audioWebCodecsMap[codec];
  if (codec === "aac") {
    config.bitrate = 96000;
  }

  return config;
};
