// import
import {
  HandLandmarker,
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
let poseRecognizer;
let handNumber = 1;
let isDetecting;
let lastExecutionTime = 0;

const HAND_LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,

  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,

  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,

  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,

  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
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

  await createPoseRecognizer().then(() => {
    detectHandPoseFromVideo(videoElement.srcObject);
  });
}

async function createPoseRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  poseRecognizer = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numHands: handNumber,
  });
}

async function detectHandPoseFromVideo(stream) {
  isDetecting = true;

  const videoTrack = stream.getVideoTracks()[0];
  const capturedImage = new ImageCapture(videoTrack);
  while (poseRecognizer && isDetecting) {
    await capturedImage.grabFrame().then(async (imageBitmap) => {
      const detectedPoses = poseRecognizer.detect(imageBitmap);
      if (context) {
        drawToCanvas(detectedPoses);
      }

      const { handednesses, landmarks, worldLandmarks } = detectedPoses;

      if (landmarks[0]) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastExecutionTime;

        if (elapsedTime >= 300) {
          console.log(landmarks);
          sendCommandToDevice(calculateAngles(landmarks[0]));

          lastExecutionTime = currentTime;
        }
      }
    });
  }
}

function sendCommandToDevice(command) {
  if (currentCommand === command || !command) return;
  currentCommand = command;

  const controlData = {
    type: "control",
    servo: command,
  };
  console.log(controlData);

  controlWebsocket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}

function calculateAngles(landmarks) {
  // Thumb
  const thumbBaseLandmark = landmarks[HAND_LANDMARK.THUMB_MCP];
  const thumbMiddleLandmark = landmarks[HAND_LANDMARK.THUMB_IP];
  const thumbTipLandmark = landmarks[HAND_LANDMARK.THUMB_TIP];
  const thumbAngle = calculateAngle(
    thumbBaseLandmark,
    thumbMiddleLandmark,
    thumbTipLandmark
  );

  // Index
  const indexBaseLandmark = landmarks[HAND_LANDMARK.WRIST];
  const indexMiddleLandmark = landmarks[HAND_LANDMARK.INDEX_FINGER_MCP];
  const indexTipLandmark = landmarks[HAND_LANDMARK.INDEX_FINGER_TIP];
  const indexAngle = calculateAngle(
    indexBaseLandmark,
    indexMiddleLandmark,
    indexTipLandmark
  );

  // Middle
  const middleBaseLandmark = landmarks[HAND_LANDMARK.WRIST];
  const middleMiddleLandmark = landmarks[HAND_LANDMARK.MIDDLE_FINGER_MCP];
  const middleTipLandmark = landmarks[HAND_LANDMARK.MIDDLE_FINGER_TIP];
  const middleAngle = calculateAngle(
    middleBaseLandmark,
    middleMiddleLandmark,
    middleTipLandmark
  );

  // Ring
  const ringBaseLandmark = landmarks[HAND_LANDMARK.WRIST];
  const ringMiddleLandmark = landmarks[HAND_LANDMARK.RING_FINGER_MCP];
  const ringTipLandmark = landmarks[HAND_LANDMARK.RING_FINGER_TIP];
  const ringAngle = calculateAngle(
    ringBaseLandmark,
    ringMiddleLandmark,
    ringTipLandmark
  );

  // Pinky
  const pinkyBaseLandmark = landmarks[HAND_LANDMARK.WRIST];
  const pinkyMiddleLandmark = landmarks[HAND_LANDMARK.PINKY_MCP];
  const pinkyTipLandmark = landmarks[HAND_LANDMARK.PINKY_TIP];
  const pinkyAngle = calculateAngle(
    pinkyBaseLandmark,
    pinkyMiddleLandmark,
    pinkyTipLandmark
  );

  return [thumbAngle, indexAngle, middleAngle, ringAngle, pinkyAngle];
}

function calculateAngle(base, middle, tip) {
  const vector1 = {
    x: middle.x - base.x,
    y: middle.y - base.y,
    z: middle.z - base.z,
  };
  const vector2 = {
    x: middle.x - tip.x,
    y: middle.y - tip.y,
    z: middle.z - tip.z,
  };

  const dotProduct =
    vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

  const magnitude1 = Math.sqrt(
    vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2
  );
  const magnitude2 = Math.sqrt(
    vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2
  );

  const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));

  const angleDegrees = (angleRadians * 180) / Math.PI;

  return Math.round(angleDegrees);
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
