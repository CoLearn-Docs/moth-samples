// DomElement
const pubAudioElement = document.getElementById("pubAudioElement");
const buttonInitializePubWebSocket = document.getElementById(
  "buttonInitializePubWebSocket"
);
const buttonClosePubWebSocket = document.getElementById(
  "buttonClosePubWebsocket"
);

// Variables
let pubWebsocket;
const encodeCodec = "opus";
const encoder = new EncoderAudio();

document.addEventListener("DOMContentLoaded", async function () {
  pubAudioElement.srcObject = await navigator.mediaDevices
    .getUserMedia({ audio: true })
    .catch((error) => {
      console.log(">> Get audio error:", error);
      throw error;
    });

  buttonInitializePubWebSocket.addEventListener(
    "click",
    initializePubWebSocket
  );
  buttonClosePubWebSocket.addEventListener("click", closePubWebsocket);
});

function initializePubWebSocket() {
  if (pubWebsocket) return;

  const pubAPIOption = setAPIOption();
  pubAPIOption.type = "pub";

  pubWebsocket = new WebSocket(setAPI(pubAPIOption));
  pubWebsocket.binaryType = "arraybuffer";

  pubWebsocket.onopen = () => {
    console.log(">> Open Pub Websocket");
    sendAudio();
  };

  pubWebsocket.onclose = () => {
    console.log(">> Close Pub Websocket");
  };

  pubWebsocket.onerror = (error) => {
    console.log(">> Error Pub Websocket", error);
  };
}

async function sendAudio() {
  if (!pubWebsocket) return;

  let codecConfig = getAudioEncoderConfig(encodeCodec);

  encoder.encode(codecConfig, pubAudioElement.srcObject, sendChunk, mimeSend);
}

async function closePubWebsocket() {
  await encoder.stop();

  if (pubWebsocket) pubWebsocket.close();
}

function sendChunk(chunk) {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);

  if (pubWebsocket) pubWebsocket.send(chunkData);
}

const mimeSend = (mimeObject) => {
  if (pubWebsocket) pubWebsocket.send(mimeObjectToMimeString(mimeObject));
};

function mimeObjectToMimeString(mimeObject) {
  let mimeType;

  if (mimeObject.codec.includes("opus")) {
    mimeType = "audio/opus";
  } else if (mimeObject.codec.includes("mp4a")) {
    mimeType = "audio/aac";
  }

  let mimeString = mimeType + ";";

  if (mimeObject.codec) mimeString += `codecs=${mimeObject.codec};`;
  if (mimeObject.bitrate) mimeString += `bitrate=${mimeObject.bitrate};`;
  if (mimeObject.numberOfChannels)
    mimeString += `numberOfChannels=${mimeObject.numberOfChannels};`;
  if (mimeObject.sampleRate)
    mimeString += `sampleRate=${mimeObject.sampleRate};`;

  return mimeString;
}
