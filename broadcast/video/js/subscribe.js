// DomElement
const subCanvasElement = document.getElementById("subCanvasElement");
const buttonInitializeSubWebSocket = document.getElementById(
  "buttonInitializeSubWebSocket"
);
const buttonCloseSubWebsocket = document.getElementById(
  "buttonCloseSubWebsocket"
);

// Variables
let subWebsocket;
let mime;
let isFullScreen = false;
const decoder = new DecoderVideo();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeSubWebSocket.addEventListener(
    "click",
    initializeSubWebSocket
  );
  buttonCloseSubWebsocket.addEventListener("click", closeSubWebsocket);
  subCanvasElement.addEventListener("click", fullscreenVideo);
});

function initializeSubWebSocket() {
  if (subWebsocket) return;

  const subAPIOption = setAPIOption();
  subAPIOption.type = "sub";

  subWebsocket = new WebSocket(setAPI(subAPIOption));
  subWebsocket.binaryType = "arraybuffer";

  subWebsocket.onopen = () => {
    console.log(">> Open Sub Websocket");
  };

  subWebsocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (mime != event.data) {
        mime = event.data;

        subCanvasElement.width = mimeStringToMimeObject(mime).width;
        subCanvasElement.height = mimeStringToMimeObject(mime).height;
        decoder.setDecoder(mimeStringToMimeObject(mime), drawToCanvas);
      }
    } else if (typeof event.data == "object") {
      decoder.decode(processVideoData(event));
    }
  };

  subWebsocket.onclose = () => {
    console.log(">> Close Sub Websocket");
  };

  subWebsocket.onerror = (error) => {
    console.log(">> Error Sub Websocket", error);
  };
}

async function closeSubWebsocket() {
  await decoder.stop();

  if (subWebsocket) subWebsocket.close();
}

function mimeStringToMimeObject(mimeString) {
  const [mimeType, ...mimeOption] = mimeString.split(";");

  const mimeOptionObj = mimeOption.reduce((acc, option) => {
    const [key, value] = option.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  mimeOptionObj.codec = mimeOptionObj.codecs;

  return mimeOptionObj;
}

function processVideoData(event) {
  const data = new Uint8Array(event.data);
  const encodedChunk = new EncodedVideoChunk({
    type: data.length > 100000 ? "key" : "delta",
    data: data,
    timestamp: event.timeStamp,
    duration: 0,
  });

  return encodedChunk;
}

function drawToCanvas(frame) {
  const ctx = subCanvasElement.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, subCanvasElement.width, subCanvasElement.height);
}

function fullscreenVideo() {
  if (!isFullScreen) {
    if (subCanvasElement.requestFullScreen) {
      subCanvasElement.requestFullScreen();
    } else if (subCanvasElement.webkitRequestFullScreen) {
      subCanvasElement.webkitRequestFullScreen();
    } else if (subCanvasElement.mozRequestFullScreen) {
      subCanvasElement.mozRequestFullScreen();
    } else if (subCanvasElement.msRequestFullScreen) {
      subCanvasElement.msRequestFullScreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozcancelFullScreen) {
      document.mozcancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  isFullScreen = !isFullScreen;
}
