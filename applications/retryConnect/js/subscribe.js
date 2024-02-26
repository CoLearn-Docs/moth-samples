// DomElement
const subCanvasElement = document.getElementById("subCanvasElement");
const subAudioElement = document.getElementById("subAudioElement");
const buttonInitializeSubWebSocket = document.getElementById(
  "buttonInitializeSubWebSocket"
);
const buttonCloseSubWebsocket = document.getElementById(
  "buttonCloseSubWebsocket"
);

// Variables
let subVideoWebsocket, subVideoAPIOption, videoMime;
let isFullScreen = false;
const videoDecoder = new DecoderVideo();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeSubWebSocket.addEventListener(
    "click",
    initializeSubWebSocket
  );
  buttonCloseSubWebsocket.addEventListener("click", closeSubWebsocket);
  subCanvasElement.addEventListener("click", fullscreenVideo);
});

function initializeSubWebSocket() {
  if (subVideoWebsocket) return;

  subVideoAPIOption = setAPIOption();
  subVideoAPIOption.type = "sub";
  subVideoAPIOption.track = "video";

  subVideoWebsocket = new WebSocket(setAPI(subVideoAPIOption));
  subVideoWebsocket.binaryType = "arraybuffer";

  subVideoWebsocket.onopen = () => {
    console.log(">> Open Sub Websocket : " + now());
  };

  subVideoWebsocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (videoMime != event.data) {
        videoMime = event.data;
        console.log(">> Mime: ", videoMime);

        subCanvasElement.width = mimeStringToMimeObjectVideo(videoMime).width;
        subCanvasElement.height = mimeStringToMimeObjectVideo(videoMime).height;
        videoDecoder.setDecoder(
          mimeStringToMimeObjectVideo(videoMime),
          drawToCanvas
        );
      }
    } else if (typeof event.data == "object") {
      videoDecoder.decode(processVideoData(event));
    }
  };

  subVideoWebsocket.onclose = () => {
    console.log(">> Close Sub Websocket : " + now());
    retryWebsocket();
  };

  subVideoWebsocket.onerror = (error) => {
    console.log(">> Error Sub Websocket", error);
  };
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

async function closeSubWebsocket() {
  await videoDecoder.stop();

  if (subVideoWebsocket) subVideoWebsocket.close();
}

function mimeStringToMimeObjectVideo(mimeString) {
  const [mimeType, ...mimeOption] = mimeString.split(";");

  const mimeOptionObj = mimeOption.reduce((acc, option) => {
    const [key, value] = option.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  mimeOptionObj.codec = mimeOptionObj.codecs;

  return mimeOptionObj;
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
