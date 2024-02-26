class DecoderVideo {
  decoder = null;
  frameQueue = [];
  timeBase = 0;
  handleChunk;
  decoderId;
  decoderConfig;
  isDecoding = false;

  async isConfigSupported(config) {
    return await VideoDecoder.isConfigSupported(config);
  }

  async setDecoder(decoderConfig, handleChunk, decoderId) {
    this.decoderId = decoderId;
    this.decoderConfig = decoderConfig;
    this.handleChunk = handleChunk;

    if (!this.isConfigSupported(decoderConfig)) {
      alert("video decoder configuration is not supported");
      return;
    }

    this.decoder = new VideoDecoder({
      output: async (frame) => {
        this.handleFrame(frame);
      },
      error: (error) => {
        throw error;
        this.isDecoding = false;
      },
    });

    this.decoder.configure(decoderConfig);
  }

  handleFrame(frame) {
    this.frameQueue.push(frame);
    if (!this.isDecoding) {
      this.renderFrame();
      this.isDecoding = true;
    }
  }

  async renderFrame() {
    while (true) {
      if (this.frameQueue.length === 0) {
        this.isDecoding = false;
        return;
      }

      const frame = this.frameQueue.shift();
      if (frame) {
        const timeUntilNextFrame = this.calculateTimeUntilNextFrame(
          frame.timestamp
        );

        await new Promise((r) => {
          setTimeout(r, timeUntilNextFrame);
        });

        this.handleChunk(frame, this.decoderId);

        frame.close();
      }
    }
  }
  calculateTimeUntilNextFrame(timestamp) {
    if (this.timeBase === 0) {
      this.timeBase = performance.now();
    }
    const mediaTime = performance.now() - this.timeBase;
    return Math.max(0, timestamp / 1000 - mediaTime);
  }

  async decode(encodedVideoChunk) {
    try {
      this.decoder.decode(encodedVideoChunk, this.decoderId);
    } catch (error) {
      this.setDecoder(this.decoderConfig, this.handleChunk, this.decoderId);
    }
  }

  async stop() {
    if (this.decoder && this.decoder.state !== "closed") {
      this.decoder.close();
      this.isDecoding = false;
    }
  }
}
