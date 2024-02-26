import { LidarVisualization } from "./lidarVisualization.js";

// DomElement
const buttonInitializeWebSocket = document.getElementById(
  "buttonInitializeWebSocket"
);
const buttonCloseWebsocket = document.getElementById("buttonCloseWebsocket");
const lidarWrapper = document.getElementById("lidarWrapper");

// Variables
let socket;
let play = true;
const lidarVis = new LidarVisualization();

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeWebSocket.addEventListener("click", initializeWebSocket);
  buttonCloseWebsocket.addEventListener("click", closeWebsocket);
});

function initializeWebSocket() {
  if (socket) return;

  const APIOption = setAPIOption();

  socket = new WebSocket(setAPI(APIOption));
  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    console.log(">> Open Sub Websocket");
    lidarVis.init(lidarWrapper, 800, 600);
  };

  socket.onmessage = async (event) => {
    if (typeof event.data == "string") {
      console.log(">> Receive mime: ", event.data);
    } else if (typeof event.data == "object") {
      const dataString = new TextDecoder().decode(event.data);
      const lines = dataString.split("\n");

      const dataArray = lines.map((line) => {
        const parts = line.split(", ");
        const quality = parseInt(parts[0].split(": ")[1]);
        const angle = parseFloat(parts[1].split(": ")[1]);
        const distance = parseFloat(parts[2].split(": ")[1]);
        return { Quality: quality, Angle: angle, Distance: distance };
      });

      if (play) {
        lidarVis.clearScene();

        for (var i = 0; i < dataArray.length; i++) {
          var point = dataArray[i];
          var accuracy = point.Quality;
          var angle = point.Angle;
          var distance = point.Distance;
          lidarVis.drawPoint3D(accuracy, angle, distance);
        }
        play = false;
        setTimeout(() => {
          play = true;
        }, 100);
      }
    }
  };

  socket.onclose = () => {
    console.log(">> Close Sub Websocket");
  };

  socket.onerror = (error) => {
    console.log(">> Error Sub Websocket", error);
  };
}

async function closeWebsocket() {
  if (socket) socket.close();
}
