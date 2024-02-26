class EncoderVideo {
  encoder = null;
  keyFrameInterval = 3;
  frameCounter = 0;
  encoderId;

  async isConfigSupported(config) {
    return await VideoEncoder.isConfigSupported(config);
  }

  async encode(encoderConfig, stream, handleChunk, mimeSend, encoderId) {
    this.encoderId = encoderId;

    const track = stream.getVideoTracks()[0];
    const trackProcessor = new MediaStreamTrackProcessor(track);
    const reader = trackProcessor.readable.getReader();
    mimeSend(encoderConfig, encoderId);

    let frameCounter = 0;

    if (!this.isConfigSupported(encoderConfig)) {
      alert("video encoder configuration is not supported");
      return;
    }

    this.encoder = new VideoEncoder({
      output: (chunk) => {
        this.pendingOutputs--;
        handleChunk(chunk, encoderId);
      },
      error: (error) => {
        throw error;
      },
    });
    this.encoder.configure(encoderConfig);

    while (true) {
      const { done, value } = await reader.read();
      if (done) return;

      this.frameCounter++;

      if (this.encoder.encodeQueueSize <= 2) {
        this.encoder.encode(value, {
          keyFrame: this.frameCounter % this.keyFrameInterval === 0,
        });
      }
      value.close();
    }
  }

  async stop() {
    if (this.encoder) {
      this.encoder.close();
    }
  }
}
