class EncoderAudio {
  encoder = null;

  async isConfigSupported(config) {
    return await AudioEncoder.isConfigSupported(config);
  }

  async encode(audioEncoderConfig, stream, handleChunk, mimeSend) {
    const audioTrack = stream.getAudioTracks()[0];
    const audioSettings = audioTrack.getSettings();
    const numberOfChannels = audioSettings.channelCount;
    const sampleRate = audioSettings.sampleRate;
    audioEncoderConfig.numberOfChannels = numberOfChannels;
    audioEncoderConfig.sampleRate = sampleRate;

    const trackProcessor = new MediaStreamTrackProcessor(audioTrack);
    const reader = trackProcessor.readable.getReader();

    if (!(await this.isConfigSupported(audioEncoderConfig))) {
      console.log(">> Audio encoder configuration is not supported");
      return;
    }
    mimeSend(audioEncoderConfig);

    this.encoder = new AudioEncoder({
      output: handleChunk,
      error: (error) => {
        throw error;
      },
    });

    this.encoder.configure(audioEncoderConfig);
    console.log(">> Set Audio Encoder Configure:", audioEncoderConfig);

    while (true) {
      const { done, value } = await reader.read();

      if (done) return;
      if (this.encoder.state === "closed") return;

      this.encoder.encode(value);
      value.close();
    }
  }

  async stop() {
    if (this.encoder && this.encoder.state !== "closed") {
      this.encoder.close();
    }
  }
}
