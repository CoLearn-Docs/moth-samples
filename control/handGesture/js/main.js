// import
import {
  GestureRecognizer,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// DomElement
const videoElement = document.getElementById("videoElement");
const canvasElement = document.getElementById("canvasElement");
const buttonConnectDevice = document.getElementById("buttonConnectDevice");
const context = canvasElement.getContext("2d");

// Variables
let controlWebsocket;
let currentCommand;
let gestureRecognizer;

const gestureCommandMap = {
  Closed_Fist: "N",
  Open_Palm: "S",
  Pointing_Up: "CCW",
  Victory: "CW",
  Thumb_Up: "STOP",
};

document.addEventListener("DOMContentLoaded", async () => {
  videoElement.srcObject = await navigator.mediaDevices
    .getUserMedia({ video: true })
    .catch((error) => {
      console.log(">> Get Video error:", error);
      throw error;
    });

  buttonConnectDevice.addEventListener("click", openSubWebsocket);
});

function openSubWebsocket() {
  if (controlWebsocket) return;

  const controlAPIOption = setAPIOption();
  controlWebsocket = new WebSocket(setAPI(controlAPIOption));
  controlWebsocket.binaryType = "arraybuffer";

  controlWebsocket.onopen = () => {
    console.log(">> Open Control Websocket");
    sendCommand();
  };

  controlWebsocket.onclose = () => {
    console.log(">> Close Control Websocket");
  };

  controlWebsocket.onerror = (error) => {
    console.log(">> Error Control Websocket", error);
  };
}

async function sendCommand() {
  if (!controlWebsocket) return;

  await createGestureRecognizer().then(() => {
    detectHandGestureFromVideo(gestureRecognizer, videoElement.srcObject);
  });
}

async function createGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
  });
}

async function detectHandGestureFromVideo(gestureRecognizer, stream) {
  if (!gestureRecognizer) return;

  const videoTrack = stream.getVideoTracks()[0];
  const capturedImage = new ImageCapture(videoTrack);
  while (true) {
    await capturedImage.grabFrame().then((imageBitmap) => {
      const detectedGestures = gestureRecognizer.recognize(imageBitmap);

      const { landmarks, worldLandmarks, handednesses, gestures } =
        detectedGestures;
      if (context) {
        drawToCanvas(detectedGestures);
      }

      if (gestures[0]) {
        const gesture = gestures[0][0].categoryName;

        if (Object.keys(gestureCommandMap).includes(gesture)) {
          sendCommandToDevice(gestureCommandMap[gesture]);
        }
      }
    });
  }
}

async function sendCommandToDevice(command) {
  if (currentCommand === command || !command) return;
  currentCommand = command;

  const controlData = {
    type: "control",
    direction: command,
  };
  console.log(controlData);

  controlWebsocket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}

async function drawToCanvas(handLandmarkerResult) {
  context.save();
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (const landmarks of handLandmarkerResult.landmarks) {
    drawConnectors(context, landmarks, HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 2,
    });
    drawLandmarks(context, landmarks, { color: "#FF0000", lineWidth: 0.1 });
  }
  context.restore();
}
