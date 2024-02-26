// DomElement
const pubVideoElement = document.getElementById("pubVideoElement");
const buttonInitializePubWebSocket = document.getElementById(
  "buttonInitializePubWebSocket"
);
const buttonClosePubWebSocket = document.getElementById(
  "buttonClosePubWebsocket"
);

// Variables
let pubWebsocket;
const encodeCodec = "vp9";
const encodeResolution = "480p";
const encoder = new EncoderVideo();

document.addEventListener("DOMContentLoaded", async function () {
  pubVideoElement.srcObject = await navigator.mediaDevices
    .getUserMedia({ video: true })
    .catch((error) => {
      console.log(">> Get Video error:", error);
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
    sendVideo();
  };

  pubWebsocket.onclose = () => {
    console.log(">> Close Pub Websocket");
  };

  pubWebsocket.onerror = (error) => {
    console.log(">> Error Pub Websocket", error);
  };
}

async function sendVideo() {
  if (!pubWebsocket) return;

  let codecConfig = getVideoEncoderConfig(encodeCodec, encodeResolution);

  encoder.encode(codecConfig, pubVideoElement.srcObject, sendChunk, mimeSend);
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

  if (mimeObject.codec.includes("avc1")) {
    mimeType = "video/h264";
  } else if (mimeObject.codec.includes("vp8")) {
    mimeType = "video/vp8";
  } else if (mimeObject.codec.includes("vp09")) {
    mimeType = "video/vp9";
  } else if (mimeObject.codec.includes("av01")) {
    mimeType = "video/av1";
  } else if (mimeObject.codec.includes("hev")) {
    mimeType = "video/h265";
  } else if (mimeObject.codec.includes("image")) {
    mimeType = mimeObject.codec;
  }

  let mimeString = mimeType + ";";

  if (mimeObject.codec) mimeString += `codecs=${mimeObject.codec};`;
  if (mimeObject.width) mimeString += `width=${mimeObject.width};`;
  if (mimeObject.height) mimeString += `height=${mimeObject.height};`;
  if (mimeObject.framerate) mimeString += `framerate=${mimeObject.framerate};`;
  if (mimeObject.bitrate) mimeString += `bitrate=${mimeObject.bitrate};`;

  return mimeString;
}
