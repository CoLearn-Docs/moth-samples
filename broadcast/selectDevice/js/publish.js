// DomElement
const pubVideoElement = document.getElementById("pubVideoElement");
const buttonInitializePubWebSocket = document.getElementById(
  "buttonInitializePubWebSocket"
);
const buttonClosePubWebSocket = document.getElementById(
  "buttonClosePubWebsocket"
);
const selectCamera = document.getElementById("selectCamera");
const selectMicrophone = document.getElementById("selectMicrophone");
const selectSpeaker = document.getElementById("selectSpeaker");

// Variables
let devices;
let pubVideoWebsocket;
let pubAudioWebsocket;
const encodeAudioCodec = "opus";
const encodeVideoCodec = "vp9";
const encodeVideoResolution = "480p";
const audioEncoder = new EncoderAudio();
const videoEncoder = new EncoderVideo();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializePubWebSocket.addEventListener(
    "click",
    initializePubWebSocket
  );
  buttonClosePubWebSocket.addEventListener("click", closePubWebsocket);
  selectCamera.addEventListener("change", selectedInputDevice);
  selectMicrophone.addEventListener("change", selectedInputDevice);

  devices = await getMediaDevices();

  devices.video.map((device) => {
    const option = document.createElement("option");
    option.text = device.name;
    option.value = device.id;

    selectCamera.append(option);
  });

  devices.audioInput.map((device) => {
    const option = document.createElement("option");
    option.text = device.name;
    option.value = device.id;

    selectMicrophone.append(option);
  });

  devices.audioOutput.map((device) => {
    const option = document.createElement("option");
    option.text = device.name;
    option.value = device.id;

    selectSpeaker.append(option);
  });
  pubVideoElement.srcObject = await getMedia();
});

async function getMediaDevices() {
  let deviceList;
  await navigator.mediaDevices.enumerateDevices().then((device) => {
    deviceList = getMediaDevice(device);
  });
  return deviceList;
}

function getMediaDevice(devices) {
  let deviceList = {
    video: [],
    audioInput: [],
    audioOutput: [],
  };
  devices.map((device) => {
    if (device.kind === "videoinput") {
      deviceList.video.push({ name: device.label, id: device.deviceId });
    }
    if (device.kind === "audioinput") {
      deviceList.audioInput.push({ name: device.label, id: device.deviceId });
    }
    if (device.kind === "audiooutput") {
      deviceList.audioOutput.push({ name: device.label, id: device.deviceId });
    }
  });
  return deviceList;
}

function getMedia(microphoneId, cameraId) {
  const constraints = {
    video: {
      deviceId: cameraId ? cameraId : undefined,
    },
    audio: {
      deviceId: microphoneId ? microphoneId : undefined,
    },
  };

  return navigator.mediaDevices.getUserMedia(constraints).catch((error) => {
    console.log(">> Get Media error:", error);
    throw error;
  });
}

async function selectedInputDevice() {
  const cameraId = selectCamera.value;
  const microphoneId = selectMicrophone.value;
  pubVideoElement.srcObject = await getMedia(microphoneId, cameraId);
}

function initializePubWebSocket() {
  if (!pubVideoWebsocket) {
    initializePubWebSocketVideo();
  }
  if (!pubAudioWebsocket) {
    initializePubWebSocketAudio();
  }
}

function initializePubWebSocketVideo() {
  if (pubVideoWebsocket) return;

  const pubVideoAPIOption = setAPIOption();
  pubVideoAPIOption.type = "pub";
  pubVideoAPIOption.track = "video";

  pubVideoWebsocket = new WebSocket(setAPI(pubVideoAPIOption));
  pubVideoWebsocket.binaryType = "arraybuffer";

  pubVideoWebsocket.onopen = () => {
    console.log(">> Open Video Pub Websocket");
    sendVideo();
  };

  pubVideoWebsocket.onclose = () => {
    console.log(">> Close Video Pub Websocket");
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

function initializePubWebSocketAudio() {
  if (pubAudioWebsocket) return;

  const pubAudioAPIOption = setAPIOption();
  pubAudioAPIOption.type = "pub";
  pubAudioAPIOption.track = "audio";

  pubAudioWebsocket = new WebSocket(setAPI(pubAudioAPIOption));
  pubAudioWebsocket.binaryType = "arraybuffer";

  pubAudioWebsocket.onopen = () => {
    console.log(">> Open Audio Pub Websocket");
    sendAudio();
  };

  pubAudioWebsocket.onclose = () => {
    console.log(">> Close Audio Pub Websocket");
  };

  pubAudioWebsocket.onerror = (error) => {
    console.log(">> Error Audio Pub Websocket", error);
  };
}

async function sendAudio() {
  if (!pubAudioWebsocket) return;

  let codecConfig = getAudioEncoderConfig(encodeAudioCodec);
  console.log(`>> Codec config : ${JSON.stringify(codecConfig)}`);

  audioEncoder.encode(
    codecConfig,
    pubVideoElement.srcObject,
    sendAudioChunk,
    mimeAudioSend
  );
}

function sendAudioChunk(chunk) {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);

  if (pubAudioWebsocket) pubAudioWebsocket.send(chunkData);
}

const mimeAudioSend = (mimeObject) => {
  if (pubAudioWebsocket)
    pubAudioWebsocket.send(mimeObjectToMimeStringAudio(mimeObject));
};

async function closePubWebsocket() {
  await audioEncoder.stop();
  await videoEncoder.stop();

  if (pubVideoWebsocket) pubVideoWebsocket.close();
  if (pubAudioWebsocket) pubAudioWebsocket.close();
}

function mimeObjectToMimeStringAudio(mimeObject) {
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
