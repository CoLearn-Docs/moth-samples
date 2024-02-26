// DomElement
const canvasElement = document.getElementById("canvasElement");
const buttonInitializeWebSocket = document.getElementById(
  "buttonInitializeWebSocket"
);
const buttonCloseWebsocket = document.getElementById("buttonCloseWebsocket");
const buttonFan = document.getElementById("buttonFan");
const buttonServo = document.getElementById("buttonServoMotor");
const temperatureText = document.getElementById("temperatureText");
const humidityText = document.getElementById("humidityText");
const illuminanceText = document.getElementById("illuminanceText");
const temperatureBar = document.getElementById("temperatureBar");
const humidityBar = document.getElementById("humidityBar");
const illuminanceBar = document.getElementById("illuminanceBar");

// Variables
let websocket;
let mime;
let pingInterval;
let isFanOn = false;
let isServoOn = false;
const decoder = new DecoderVideo();
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeWebSocket.addEventListener("click", initializeWebSocket);
  buttonCloseWebsocket.addEventListener("click", closeWebsocket);
  buttonFan.addEventListener("click", () => toggleControl("fan"));
  buttonServo.addEventListener("click", () => toggleControl("servo"));
});

function initializeWebSocket() {
  if (websocket) return;

  const subAPIOption = setAPIOption();
  subAPIOption.type = "sub";
  subAPIOption.mode = "bundle";

  websocket = new WebSocket(setAPI(subAPIOption));
  websocket.binaryType = "arraybuffer";

  websocket.onopen = () => {
    console.log(">> Open Websocket");
    pingInterval = setInterval(() => {
      websocket.send(textEncoder.encode("ping"));
    }, 10000);
  };

  websocket.onmessage = (event) => {
    if (typeof event.data == "string") {
      if (mime != event.data) {
        mime = event.data;
        console.log(">> Mime: ", mime);
        decoder.setDecoder(mimeStringToMimeObject(mime), drawToCanvas);
      }
    } else if (typeof event.data == "object") {
      if (textDecoder.decode(event.data).includes("sensor")) {
        const data = JSON.parse(textDecoder.decode(event.data)).sensor;
        viewSensorData(data);
      } else {
        decoder.decode(processVideoData(event));
      }
    }
  };

  websocket.onclose = () => {
    console.log(">> Close Websocket");
  };

  websocket.onerror = (error) => {
    console.log(">> Error Websocket", error);
  };
}

function closeWebsocket() {
  if (!websocket) return;

  decoder.stop();
  websocket.close();
}

function viewSensorData(data) {
  temperatureBar.style.width = convertTemperature(data.temperature) + "%";
  temperatureText.innerHTML = data.temperature + " °C";
  humidityBar.style.width = data.humidity + "%";
  humidityText.innerHTML = data.humidity + " %";
  illuminanceBar.style.width = convertIlluminance(data.lux) + "%";
  illuminanceText.innerHTML = data.lux + " lx";
  const timestamp = new Date().getTime() / 1000 - data.timestamp;

  console.log(`>> Time : ${timestamp.toFixed(3)}s`);
}

function convertTemperature(temp) {
  var adjustedTemp = temp + 20;
  var percentage = (adjustedTemp / 80) * 100;
  percentage = Math.max(0, Math.min(100, percentage));

  return percentage;
}

function convertIlluminance(lux) {
  var percentage = (lux / 25000) * 100;
  percentage = Math.max(0, Math.min(100, percentage));

  return percentage;
}

function toggleControl(controlType) {
  if (!websocket) return;

  const isOn = controlType === "fan" ? isFanOn : isServoOn;
  const newStatus = isOn ? "0" : "1";
  const currentTimestamp = new Date().getTime() / 1000;

  console.log(`>> ${controlType} : ${currentTimestamp}`);

  websocket.send(
    textEncoder.encode(
      JSON.stringify({
        [controlType]: newStatus,
        timestamp: currentTimestamp,
      })
    )
  );

  if (controlType === "fan") {
    isFanOn = !isFanOn;
  } else if (controlType === "servo") {
    isServoOn = !isServoOn;
  }
}

// video
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
  const ctx = canvasElement.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, canvasElement.width, canvasElement.height);
}
