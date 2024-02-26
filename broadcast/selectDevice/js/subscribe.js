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
let subAudioWebsocket, audioMime;
let subVideoWebsocket, videoMime;
let isFullScreen = false;
const audioDecoder = new DecoderAudio();
const videoDecoder = new DecoderVideo();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeSubWebSocket.addEventListener(
    "click",
    initializeSubWebSocket
  );
  buttonCloseSubWebsocket.addEventListener("click", closeSubWebsocket);
  subCanvasElement.addEventListener("click", fullscreenVideo);
  selectSpeaker.addEventListener("change", selectedOutPutDevice);
});

async function selectedOutPutDevice() {
  const speakerId = selectSpeaker.value;
  subAudioElement.setSinkId(speakerId);
}

function initializeSubWebSocket() {
  if (!subAudioWebsocket) {
    initializeSubWebSocketAudio();
  }
  if (!subVideoWebsocket) {
    initializeSubWebSocketVideo();
  }
}

function initializeSubWebSocketVideo() {
  if (subVideoWebsocket) return;

  const subVideoAPIOption = setAPIOption();
  subVideoAPIOption.type = "sub";
  subVideoAPIOption.track = "video";

  subVideoWebsocket = new WebSocket(setAPI(subVideoAPIOption));
  subVideoWebsocket.binaryType = "arraybuffer";

  subVideoWebsocket.onopen = () => {
    console.log(">> Open Sub Websocket");
  };

  subVideoWebsocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (videoMime != event.data) {
        videoMime = event.data;
        console.log(">> Video Mime: ", videoMime);

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
    console.log(">> Close Sub Websocket");
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

function initializeSubWebSocketAudio() {
  if (subAudioWebsocket) return;

  const subAudioAPIOption = setAPIOption();
  subAudioAPIOption.type = "sub";
  subAudioAPIOption.track = "audio";

  subAudioWebsocket = new WebSocket(setAPI(subAudioAPIOption));
  subAudioWebsocket.binaryType = "arraybuffer";

  subAudioWebsocket.onopen = () => {
    console.log(">> Open Sub Websocket");
  };

  subAudioWebsocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (audioMime != event.data) {
        audioMime = event.data;
        console.log(">> Audio Mime: ", audioMime);

        audioDecoder.setDecoder(
          mimeStringToMimeObjectAudio(audioMime),
          playAudioData
        );
      }
    } else if (typeof event.data == "object") {
      audioDecoder.decode(processAudioData(event));
    }
  };

  subAudioWebsocket.onclose = () => {
    console.log(">> Close Sub Websocket");
  };

  subAudioWebsocket.onerror = (error) => {
    console.log(">> Error Sub Websocket", error);
  };
}

function processAudioData(event) {
  const encodedChunk = new EncodedAudioChunk({
    type: "key",
    data: event.data,
    timestamp: event.timeStamp,
    duration: 0,
  });

  return encodedChunk;
}

const audioStreamTrack = new MediaStreamTrackGenerator({
  kind: "audio",
});
const audioStream = new MediaStream([audioStreamTrack]);
const writer = audioStreamTrack.writable.getWriter();
subAudioElement.srcObject = audioStream;

const playAudioData = async (chunk) => {
  await writer.ready;
  writer.write(chunk);
  subAudioElement.play();
};

async function closeSubWebsocket() {
  await audioDecoder.stop();
  await videoDecoder.stop();

  if (subAudioWebsocket) subAudioWebsocket.close();
  if (subWebsocket) subWebsocket.close();
}

function mimeStringToMimeObjectAudio(mimeString) {
  const [mimeType, ...mimeOption] = mimeString.split(";");

  const mimeOptionObj = mimeOption.reduce((acc, option) => {
    const [key, value] = option.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  mimeOptionObj.codec = mimeOptionObj.codecs;

  return mimeOptionObj;
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
