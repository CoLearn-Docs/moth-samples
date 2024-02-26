// DomElement
const pubVideoElement = document.getElementById("pubVideoElement");
const buttonInitializePubWebSocket = document.getElementById(
  "buttonInitializePubWebSocket"
);
const buttonClosePubWebSocket = document.getElementById(
  "buttonClosePubWebsocket"
);

// Variables
let pubVideoWebsocket;
const encodeVideoCodec = "vp9";
const encodeVideoResolution = "480p";
const videoEncoder = new EncoderVideo();

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
  if (pubVideoWebsocket) return;

  const pubVideoAPIOption = setAPIOption();
  pubVideoAPIOption.type = "pub";
  pubVideoAPIOption.track = "video";

  pubVideoWebsocket = new WebSocket(setAPI(pubVideoAPIOption));
  pubVideoWebsocket.binaryType = "arraybuffer";

  pubVideoWebsocket.onopen = () => {
    console.log(">> Open Video Pub Websocket : " + now());
    sendVideo();
  };

  pubVideoWebsocket.onclose = () => {
    console.log(">> Close Video Pub Websocket : " + now());
    retryWebsocket();
  };

  pubVideoWebsocket.onerror = (error) => {
    console.log(">> Error Video Pub Websocket", error);
  };
}

async function sendVideo() {
  if (!pubVideoWebsocket) return;

  let codecConfig = getVideoEncoderConfig(
    encodeVideoCodec,
    encodeVideoResolution
  );
  console.log(`>> Codec config : ${JSON.stringify(codecConfig)}`);

  videoEncoder.encode(
    codecConfig,
    pubVideoElement.srcObject,
    sendVideoChunk,
    mimeVideoSend
  );
}

function sendVideoChunk(chunk) {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);

  if (pubVideoWebsocket) pubVideoWebsocket.send(chunkData);
}

const mimeVideoSend = (mimeObject) => {
  if (pubVideoWebsocket)
    pubVideoWebsocket.send(mimeObjectToMimeStringVideo(mimeObject));
};

async function closePubWebsocket() {
  await videoEncoder.stop();

  if (pubVideoWebsocket) pubVideoWebsocket.close();
}

function mimeObjectToMimeStringVideo(mimeObject) {
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
