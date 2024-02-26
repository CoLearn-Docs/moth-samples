// import
import {
  FaceDetector,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// DomElement
const videoElement = document.getElementById("videoElement");
const buttonConnectDevice = document.getElementById("buttonConnectDevice");

// Variables
let controlWebsocket;
let currentCommand;
let faceDetector;
let isDetecting;

const detectionCommandMap = {
  UP: "N",
  DOWN: "S",
  LEFT: "CCW",
  RIGHT: "CW",
  FRONT: "STOP",
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

  await createFaceDetector().then(() => {
    detectFaceFromVideo(videoElement.srcObject);
  });
}

async function createFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
  });
}

async function detectFaceFromVideo(stream) {
  isDetecting = true;

  let lastOrientation;
  const videoTrack = stream.getVideoTracks()[0];
  const capturedImage = new ImageCapture(videoTrack);

  while (isDetecting) {
    await capturedImage.grabFrame().then((imageBitmap) => {
      const detectedFace = faceDetector.detect(imageBitmap);

      const { boundingBox, categories, keypoints } = detectedFace.detections[0];

      if (keypoints) {
        const orientation = getFaceOrientation(keypoints);
        if (orientation === lastOrientation) return;

        const command = detectionCommandMap[orientation];
        lastOrientation = orientation;

        sendCommandToDevice(command);
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

function getFaceOrientation(keypoints) {
  const [leftEye, rightEye, noseTip, mouth, leftEyeTragion, rightEyeTragion] =
    keypoints;

  const eyeMidPointX = (leftEye.x + rightEye.x) / 2;
  const noseMidPointX =
    (noseTip.x + (leftEyeTragion.x + rightEyeTragion.x) / 2) / 2;
  const eyeTragionMidPointY = (leftEyeTragion.y + rightEyeTragion.y) / 2;

  if (
    eyeMidPointX - noseMidPointX <= 0.007 &&
    eyeMidPointX - noseMidPointX >= -0.007 &&
    eyeTragionMidPointY - noseTip.y <= 0.07 &&
    eyeTragionMidPointY - noseTip.y >= -0.07
  ) {
    return "FRONT";
  } else if (
    eyeMidPointX - noseMidPointX < 0.007 &&
    eyeTragionMidPointY - noseTip.y <= 0.07 &&
    eyeTragionMidPointY - noseTip.y >= -0.07
  ) {
    return "RIGHT";
  } else if (
    eyeMidPointX - noseMidPointX > -0.007 &&
    eyeTragionMidPointY - noseTip.y <= 0.07 &&
    eyeTragionMidPointY - noseTip.y >= -0.07
  ) {
    return "LEFT";
  } else if (
    eyeTragionMidPointY - noseTip.y > 0.07 &&
    eyeMidPointX - noseMidPointX <= 0.007 &&
    eyeMidPointX - noseMidPointX >= -0.007
  ) {
    return "UP";
  } else if (
    eyeTragionMidPointY - noseTip.y < -0.07 &&
    eyeMidPointX - noseMidPointX <= 0.007 &&
    eyeMidPointX - noseMidPointX >= -0.007
  ) {
    return "DOWN";
  } else {
    return "FRONT";
  }
}
