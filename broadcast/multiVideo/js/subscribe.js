const canvasBoxContainer =
  document.getElementsByClassName("broadcast-wrapper")[0];
const inputSocketID = document.getElementById("inputSource");
const buttonCreateCanvasBox = document.getElementById("buttonCreateCanvasBox");

let sendCommandInterval;
let isFocus = true;
let isFullScreen = false;

const decoderList = {};
const websocketConnections = {};
const mimeList = {};

document.addEventListener("DOMContentLoaded", async function () {
  buttonCreateCanvasBox.addEventListener("click", createCanvasBox);
});

function createCanvasBox() {
  if (websocketConnections[`${inputSocketID.value}Websocket`]) {
    alert(
      `WebSocket connection already exists for track: ${inputSocketID.value}`
    );
    return;
  }

  const article = document.createElement("article");
  article.className = "subscribe-video";
  article.innerHTML = `
            <canvas id="${inputSocketID.value}Canvas" width="3840" height="2160"></canvas>
            <div class="row">
            <label>source: </label>
              <input value="${inputSocketID.value}" disabled/>
            </div>
  `;
  canvasBoxContainer.appendChild(article);
  document
    .getElementById(`${inputSocketID.value}Canvas`)
    .addEventListener("click", fullscreenVideo);

  createWebsocket(inputSocketID.value);
}

function createWebsocket(socketId) {
  const apiOption = setAPIOption();
  apiOption.type = "sub";

  const socket = new WebSocket(setAPI(apiOption));
  socket.binaryType = "arraybuffer";
  websocketConnections[`${socketId}Websocket`] = socket;

  initializeWebsocket(websocketConnections[`${socketId}Websocket`], socketId);
}

function initializeWebsocket(socket, socketId) {
  socket.onopen = function () {
    console.log(`>> Open ${socketId} Websocket`);

    decoderList[socketId] = new DecoderVideo();
  };

  socket.onmessage = function (event) {
    if (typeof event.data == "string") {
      if (mimeList[socketId] != event.data) {
        mimeList[socketId] = event.data;
        console.log(">> Mime: ", mimeList[socketId]);

        document.getElementById(`${socketId}Canvas`).width =
          mimeStringToMimeObject(mimeList[socketId]).width;
        document.getElementById(`${socketId}Canvas`).height =
          mimeStringToMimeObject(mimeList[socketId]).height;

        decoderList[socketId].setDecoder(
          mimeStringToMimeObject(mimeList[socketId]),
          drawToCanvas,
          socketId
        );
      }
    } else if (typeof event.data == "object") {
      if (isFocus) {
        decoderList[socketId].decode(
          processVideoData(event, mimeList[socketId])
        );
      }
    }
  };

  socket.onclose = function () {
    console.log(`>> Close ${socketId} Websocket: `);
  };

  socket.onerror = function (evt) {
    console.log(`>> Error ${socketId} Websocket ${evt}`);
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

function drawToCanvas(frame, socketId) {
  const canvas = document.getElementById(`${socketId}Canvas`);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
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

function fullscreenVideo(event) {
  const canvas = event.target;
  if (!isFullScreen) {
    if (canvas.requestFullScreen) {
      canvas.requestFullScreen();
    } else if (canvas.webkitRequestFullScreen) {
      canvas.webkitRequestFullScreen();
    } else if (canvas.mozRequestFullScreen) {
      canvas.mozRequestFullScreen();
    } else if (canvas.msRequestFullScreen) {
      canvas.msRequestFullScreen();
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

window.addEventListener("focus", () => {
  isFocus = true;
});
window.addEventListener("blur", () => {
  isFocus = false;
});
