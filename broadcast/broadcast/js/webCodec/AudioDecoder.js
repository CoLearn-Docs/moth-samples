class DecoderAudio {
  decoder = null;
  audioDecoderConfig = null;
  handleChunk = null;

  async isConfigSupported(audioDecoderConfig) {
    return await AudioDecoder.isConfigSupported(audioDecoderConfig);
  }

  async setDecoder(audioDecoderConfig, handleChunk) {
    this.handleChunk = handleChunk;
    this.audioDecoderConfig = audioDecoderConfig;

    if (!this.isConfigSupported(audioDecoderConfig)) {
      console.log("Audio decoder configuration is not supported");
      return;
    }
    console.log(
      `>> Audio decoder configuration (codec: ${audioDecoderConfig.codec}) is supported`
    );

    this.decoder = new AudioDecoder({
      output: async (chunk) => {
        if (this.handleChunk) this.handleChunk(chunk);
      },
      error: (error) => {
        switch (error.name) {
          case "InvalidStateError":
            console.warn("the state is not configured.");
            break;
          case "DataError":
            console.warn(
              "the chunk is unable to be decoded due to relying on other frames for decoding."
            );
            break;
          default:
            break;
        }

        throw error;
      },
    });

    this.decoder.configure(this.audioDecoderConfig);
  }

  decode(encodedAudioChunk) {
    try {
      if (this.decoder.state === "closed") return;

      this.decoder.decode(encodedAudioChunk);
    } catch (error) {
      console.error(">> Audio Decoding Error ", error);
    }
  }

  async stop() {
    if (this.decoder && this.decoder.state !== "closed") {
      this.decoder.close();
    }
  }
}
