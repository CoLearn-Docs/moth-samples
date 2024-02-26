import {
  GestureRecognizer,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// Dom
const videoElement = document.getElementById("videoElement");
const selectCamera = document.getElementById("selectCamera");
const buttonConnect = document.getElementById("buttonConnect");

// Variables
let socket;
let pingInterval;
let currentCommand;
let devices;
let gestureRecognizer;

const gestureCommandMap = {
  Closed_Fist: [0, 0, 0, 0, 0],
  Open_Palm: [180, 180, 180, 180, 180],
  Pointing_Up: [0, 180, 0, 0, 0],
  Thumb_Down: [180, 0, 0, 0, 0],
  Thumb_Up: [180, 0, 0, 0, 0],
  Victory: [0, 180, 180, 0, 0],
  ILoveYou: [180, 180, 0, 0, 180],
};

document.addEventListener("DOMContentLoaded", async () => {
  buttonConnect.addEventListener("click", openWebsocket);
  selectCamera.addEventListener("change", selectedDevice);

  devices = await getMediaInputDevices();
  devices.video.map((device) => {
    const option = document.createElement("option");
    option.text = device.name;
    option.value = device.id;

    selectCamera.append(option);
  });

  videoElement.srcObject = await getVideo();
});

// get Audio & Video Input Devices
const getMediaInputDevices = async () => {
  let deviceList;
  await navigator.mediaDevices.enumerateDevices().then((device) => {
    deviceList = getMediaDevice(device);
  });
  return deviceList;
};

const getMediaDevice = (devices) => {
  let deviceList = {
    video: [],
  };
  devices.map((device) => {
    if (device.kind === "videoinput") {
      deviceList.video.push({ name: device.label, id: device.deviceId });
    }
  });
  return deviceList;
};

function getVideo(cameraId) {
  const constraints = {
    video: {
      deviceId: cameraId ? cameraId : undefined,
    },
  };

  return navigator.mediaDevices.getUserMedia(constraints).catch((error) => {
    console.log(">> Get Video error:", error);
    throw error;
  });
}

async function selectedDevice() {
  const cameraId = selectCamera.value;
  videoElement.srcObject = await getVideo(cameraId);
}

// websocket
async function openWebsocket() {
  if (socket) return;

  const controlAPIOption = setAPIOption();
  socket = new WebSocket(setAPI(controlAPIOption));
  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    console.log(">> Open Websocket");

    pingInterval = setInterval(() => {
      socket.send(new TextEncoder().encode("ping"));
    }, 10000);
    sendCommand();
  };

  socket.onclose = () => {
    console.log(">> Close Websocket");
    clearInterval(pingInterval);
  };

  socket.onerror = (error) => {
    console.log(">> Error Websocket", error);
  };
}

// control
async function sendCommand() {
  if (!socket) return;

  await createGestureRecognizer().then(() => {
    if (gestureRecognizer !== null) {
      detectHandGestureFromVideo(gestureRecognizer, videoElement.srcObject);
    }
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

      if (gestures[0]) {
        const gesture = gestures[0][0].categoryName;

        if (Object.keys(gestureCommandMap).includes(gesture)) {
          sendCommandToDevice(gestureCommandMap[gesture]);
        }
      }
    });
  }
}

async function sendCommandToDevice(keyPressDirection) {
  if (currentCommand == keyPressDirection || !keyPressDirection) {
    return;
  }
  currentCommand = keyPressDirection;

  const controlData = {
    type: "control",
    servo: keyPressDirection,
  };

  socket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}
