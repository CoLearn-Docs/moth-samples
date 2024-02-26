// DomElement
const subAudioElement = document.getElementById("subAudioElement");
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
const decoder = new DecoderAudio();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeSubWebSocket.addEventListener(
    "click",
    initializeSubWebSocket
  );
  buttonCloseSubWebsocket.addEventListener("click", closeSubWebsocket);
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

        decoder.setDecoder(mimeStringToMimeObject(mime), playAudioData);
      }
    } else if (typeof event.data == "object") {
      decoder.decode(processAudioData(event));
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

function processAudioData(event) {
  const encodedChunk = new EncodedAudioChunk({
    type: "key",
    data: event.data,
    timestamp: event.timeStamp,
    duration: 0,
  });

  return encodedChunk;
}

// Audio
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
