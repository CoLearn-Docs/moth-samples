const videoBoxContainer =
  document.getElementsByClassName("broadcast-wrapper")[0];
const inputSocketID = document.getElementById("inputSource");
const selectCamera = document.getElementById("selectCamera");
const buttonCreateVideoBox = document.getElementById("buttonCreateVideoBox");

let encoderList = {};
let cameras;

const encodeCodec = "vp9";
const encodeResolution = "480p";
const websocketConnections = {};

document.addEventListener("DOMContentLoaded", async function () {
  cameras = await getCameraList();

  cameras.video.map((device) => {
    const option = document.createElement("option");
    option.text = device.name;
    option.value = device.id;

    selectCamera.append(option);
  });

  buttonCreateVideoBox.addEventListener("click", createVideoBox);
});

async function getCameraList() {
  let deviceList;
  await navigator.mediaDevices.enumerateDevices().then((device) => {
    deviceList = getVideoInputDevice(device);
  });
  return deviceList;
}

function getVideoInputDevice(devices) {
  let deviceList = {
    video: [],
    audio: [],
  };
  devices.map((device) => {
    if (device.kind === "videoinput") {
      deviceList.video.push({ name: device.label, id: device.deviceId });
    }
  });
  return deviceList;
}

async function getVideo(socketId) {
  const video = document.getElementById(`${socketId}Video`);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: selectCamera.value },
    });
    video.srcObject = stream;
  } catch (error) {
    console.error(">> Error accessing camera:", error);
  }
}

async function createVideoBox() {
  if (websocketConnections[`${inputSocketID.value}Websocket`]) {
    alert(
      `WebSocket connection already exists for track: ${inputSocketID.value}`
    );
    return;
  }
  const newSocketID = inputSocketID.value;

  const article = document.createElement("article");
  article.className = "publish-video";
  article.innerHTML = `
    <video id="${newSocketID}Video" autoplay controls></video>
    <div class="row">
      <label>source: </label>
      <input value="${newSocketID}" disabled/>
    </div>
  `;

  videoBoxContainer.appendChild(article);

  await getVideo(newSocketID);

  createWebsocket(inputSocketID.value);
}

function createWebsocket(socketId) {
  const apiOption = setAPIOption();
  apiOption.type = "pub";

  const socket = new WebSocket(setAPI(apiOption));
  socket.binaryType = "arraybuffer";
  websocketConnections[`${socketId}Websocket`] = socket;

  initializeWebsocket(websocketConnections[`${socketId}Websocket`], socketId);
}

function initializeWebsocket(socket, socketId) {
  socket.onopen = async function () {
    console.log(`>> Open ${socketId} Websocket`);

    encoderList[socketId] = new EncoderVideo();
    await sendVideo(socketId);
  };

  socket.onclose = function () {
    console.log(`>> Close ${socketId} Websocket: `);
  };
  socket.onerror = function (evt) {
    console.log(`>> Error ${socketId} Websocket ${evt}`);
  };
}

async function sendVideo(socketId) {
  if (!websocketConnections[`${socketId}Websocket`]) return;

  let codecConfig = getVideoEncoderConfig(encodeCodec, encodeResolution);
  console.log(`>> Codec config : ${JSON.stringify(codecConfig)}`);

  const video = document.getElementById(`${socketId}Video`);

  encoderList[socketId].encode(
    codecConfig,
    video.srcObject,
    sendChunk,
    mimeSend,
    socketId
  );
}

function sendChunk(chunk, socketId) {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);

  if (websocketConnections[`${socketId}Websocket`])
    websocketConnections[`${socketId}Websocket`].send(chunkData);
}

const mimeSend = (mimeObject, socketId) => {
  if (websocketConnections[`${socketId}Websocket`])
    websocketConnections[`${socketId}Websocket`].send(
      mimeObjectToMimeString(mimeObject)
    );
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
