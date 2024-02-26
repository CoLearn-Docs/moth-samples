// DomElement
const buttonConnectDevice = document.getElementById("buttonConnectDevice");

// Variables
let controlWebsocket;
let currentCommand;

const keyboardCommandMap = {
  ArrowUp: "N",
  ArrowLeft: "CCW",
  ArrowDown: "S",
  ArrowRight: "CW",
};

document.addEventListener("DOMContentLoaded", () => {
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

function sendCommand() {
  if (!controlWebsocket) return;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

async function handleKeyDown(event) {
  if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
    event.preventDefault();
  }

  sendCommandToDevice(keyboardCommandMap[event.code]);
}

async function handleKeyUp(event) {
  sendCommandToDevice("STOP");
}

async function sendCommandToDevice(command) {
  if (currentCommand == command || !command) {
    return;
  }
  currentCommand = command;

  const controlData = {
    type: "control",
    direction: command,
  };
  controlWebsocket.send(new TextEncoder().encode(JSON.stringify(controlData)));
}
