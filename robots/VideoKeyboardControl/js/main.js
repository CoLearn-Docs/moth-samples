// Dom
const canvasElement = document.getElementById("canvasElement");
const canvasElementAddVideo = document.getElementById("canvasElementAddVideo");
const buttonConnect = document.getElementById("buttonConnect");
const buttonConnectAddVideo = document.getElementById("buttonConnectAddVideo");

// Variables
let controlSocket;
let videoSocket;
let controlMime;
let videoMime;
let pingInterval;
let currentCommand;
let isFocus = true;

const videoDecoder = new DecoderVideo();
const addVideoDecoder = new DecoderVideo();
const keyboardCommandMap = {
  ArrowUp: "N",
  ArrowDown: "S",
  ArrowLeft: "CCW",
  ArrowRight: "CW",
};

document.addEventListener("DOMContentLoaded", () => {
  buttonConnect.addEventListener("click", openWebsocket);
  buttonConnectAddVideo.addEventListener("click", openWebsocketAddVideo);
});

// websocket
async function openWebsocket() {
  if (controlSocket) return;

  const controlAPIOption = setControlAPIOption();
  controlSocket = new WebSocket(setAPI(controlAPIOption));
  controlSocket.binaryType = "arraybuffer";

  controlSocket.onopen = () => {
    console.log(">> Open Control Websocket");

    pingInterval = setInterval(() => {
      controlSocket.send(new TextEncoder().encode("ping"));
    }, 10000);
    sendCommand();
  };

  controlSocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (controlMime != event.data) {
        controlMime = event.data;
        videoDecoder.setDecoder(
          mimeStringToMimeObject(controlMime),
          drawToCanvas
        );
      }
    } else if (typeof event.data == "object") {
      if (isFocus) {
        videoDecoder.decode(processVideoData(event, controlMime));
      }
    }
  };

  controlSocket.onclose = () => {
    console.log(">> Close Control Websocket");
    clearInterval(pingInterval);
  };

  controlSocket.onerror = (error) => {
    console.log(">> Error Control Websocket", error);
  };
}

async function openWebsocketAddVideo() {
  if (videoSocket) return;

  const videoAPIOption = setVideoAPIOption();
  videoSocket = new WebSocket(setAPI(videoAPIOption));
  videoSocket.binaryType = "arraybuffer";

  videoSocket.onopen = () => {
    console.log(">> Open Video Websocket");
  };

  videoSocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (videoMime != event.data) {
        videoMime = event.data;
        addVideoDecoder.setDecoder(
          mimeStringToMimeObject(videoMime),
          drawToAddCanvas
        );
      }
    } else if (typeof event.data == "object") {
      if (isFocus) {
        addVideoDecoder.decode(processVideoData(event, videoMime));
      }
    }
  };

  videoSocket.onclose = () => {
    console.log(">> Close Video Websocket");
    clearInterval(pingInterval);
  };

  videoSocket.onerror = (error) => {
    console.log(">> Error Video Websocket", error);
  };
}

// video
function processVideoData(event, mime) {
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
  const ctx = canvasElement.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, canvasElement.width, canvasElement.height);
}

function drawToAddCanvas(frame) {
  const ctx = canvasElementAddVideo.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(
    frame,
    0,
    0,
    canvasElementAddVideo.width,
    canvasElementAddVideo.height
  );
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

// control
function sendCommand() {
  if (!controlSocket) return;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

async function handleKeyDown(event) {
  if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
    event.preventDefault();
  }
  sendCommandToDevice(keyboardCommandMap[event.code]);
}

async function handleKeyUp() {
  sendCommandToDevice("STOP");
}

async function sendCommandToDevice(keyPressDirection) {
  if (currentCommand == keyPressDirection || !keyPressDirection) {
    return;
  }
  currentCommand = keyPressDirection;

  const controlData = {
    type: "control",
    direction: keyPressDirection,
  };

  controlSocket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}

window.addEventListener("focus", () => {
  isFocus = true;
});
window.addEventListener("blur", () => {
  isFocus = false;
});
