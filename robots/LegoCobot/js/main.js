// Dom
const canvasElement = document.getElementById("canvasElement");
const buttonConnect = document.getElementById("buttonConnect");

// Variables
let socket;
let mime;
let pingInterval;
let currentCommand;
let isFocus = true;

const videoDecoder = new DecoderVideo();
const keyboardCommandMap = {
  ArrowUp: "N",
  ArrowDown: "S",
  ArrowLeft: "CCW",
  ArrowRight: "CW",
};

document.addEventListener("DOMContentLoaded", () => {
  buttonConnect.addEventListener("click", openWebsocket);
});

// websocket
async function openWebsocket() {
  if (socket) return;
  await sendNetworkConfigToBluetoothDevice();

  const controlAPIOption = setAPIOption();

  socket = new WebSocket(setAPI(controlAPIOption));
  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    console.log(">> Open Websocket");

    pingInterval = setInterval(() => {
      socket.send(new TextEncoder().encode("ping"));
    }, 10000);
    sendCommand();
  };

  socket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (mime != event.data) {
        mime = event.data;
        console.log(">> Mime: ", mime);
        videoDecoder.setDecoder(mimeStringToMimeObject(mime), drawToCanvas);
      }
    } else if (typeof event.data == "object") {
      if (isFocus) {
        videoDecoder.decode(processVideoData(event));
      }
    }
  };

  socket.onclose = () => {
    console.log(">> Close Websocket");
    clearInterval(pingInterval);
  };

  socket.onerror = (error) => {
    console.log(">> Error Websocket", error);
  };
}

// video
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
  const ctx = canvasElement.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, canvasElement.width, canvasElement.height);
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
  if (!socket) return;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

async function handleKeyDown(event) {
  if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
    event.preventDefault();
  }
  sendCommandToDevice(keyboardCommandMap[event.code]);
}

async function handleKeyUp(event) {
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

  socket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}

window.addEventListener("focus", () => {
  isFocus = true;
});
window.addEventListener("blur", () => {
  isFocus = false;
});
