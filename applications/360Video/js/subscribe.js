// DomElement
const subVideoElement = document.getElementById("subVideoElement");
const buttonInitializeSubWebSocket = document.getElementById(
  "buttonInitializeSubWebSocket"
);
const buttonCloseSubWebsocket = document.getElementById(
  "buttonCloseSubWebsocket"
);
const subscribeWrapper = document.getElementById("subscribeWrapper");

// Variables
let subWebsocket;
let mime;
const decoder = new DecoderVideo();
const subVideo360 = new Video360();

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

  subWebsocket.onmessage = async (event) => {
    if (typeof event.data == "string") {
      if (mime != event.data) {
        mime = event.data;

        subVideo360.init(subVideoElement, subscribeWrapper);
        const mediaStreamTrack = new MediaStreamTrackGenerator({
          kind: "video",
        });
        const writer = mediaStreamTrack.writable.getWriter();
        await writer.ready;
        const mediaStream = new MediaStream([mediaStreamTrack]);
        subVideoElement.srcObject = mediaStream;

        const playVideo = async (frame) => {
          if (mediaStreamTrack) {
            await writer.write(frame);
            frame.close();
          }
        };

        const mimeObject = mimeStringToMimeObject(mime);
        decoder.setDecoder(mimeObject, playVideo);
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
