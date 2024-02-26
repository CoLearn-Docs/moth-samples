// DomElement
const buttonConnectDevice = document.getElementById("buttonConnectDevice");

// Variables
let controlWebsocket;
let currentCommand;
let controllers = [];
let gamePadObject;

const gemapadCommandMap = {
  leftStickUp: "N",
  leftStickDown: "S",
  leftStickLeft: "CCW",
  leftStickRight: "CW",
  LDR: "STOP",
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
    console.log(">> Open Sub Websocket");
    sendCommand();
  };

  controlWebsocket.onclose = () => {
    console.log(">> Close Sub Websocket");
  };

  controlWebsocket.onerror = (error) => {
    console.log(">> Error Sub Websocket", error);
  };
}

async function sendCommand() {
  if (!controlWebsocket) return;

  window.addEventListener("gamepadconnected", (e) => {
    handleGamepadConnected(e);
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    sendCommandToDevice("STOP");
  });
}

function handleGamepadConnected(event) {
  const gamepad = event.gamepad;
  controllers[gamepad.index] = gamepad;
  controlInterval = setInterval(() => {
    scanGamepads();
  }, 100);
}

function scanGamepads() {
  let gamepadNum = 0;
  let gamepads = navigator.getGamepads
    ? navigator.getGamepads()
    : navigator.webkitGetGamepads
    ? navigator.webkitGetGamepads()
    : [];

  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].index in controllers) {
      gamepadNum = i;
      controllers[gamepads[i].index] = gamepads[i];
    }
  }

  gamePadObject = {
    leftStickX: controllers[gamepadNum].axes[0],
    leftStickY: controllers[gamepadNum].axes[1],
    rightStickX: controllers[gamepadNum].axes[2],
    rightStickY: controllers[gamepadNum].axes[3],
    RDB: controllers[gamepadNum].buttons[0],
    RDR: controllers[gamepadNum].buttons[1],
    RDL: controllers[gamepadNum].buttons[2],
    RDT: controllers[gamepadNum].buttons[3],
    L1: controllers[gamepadNum].buttons[4],
    R1: controllers[gamepadNum].buttons[5],
    L2: controllers[gamepadNum].buttons[6],
    R2: controllers[gamepadNum].buttons[7],
    opL: controllers[gamepadNum].buttons[8],
    opR: controllers[gamepadNum].buttons[9],
    L3: controllers[gamepadNum].buttons[10],
    R3: controllers[gamepadNum].buttons[11],
    LDT: controllers[gamepadNum].buttons[12],
    LDB: controllers[gamepadNum].buttons[13],
    LDL: controllers[gamepadNum].buttons[14],
    LDR: controllers[gamepadNum].buttons[15],
  };

  sendCommandToDevice();
}

async function sendCommandToDevice() {
  let command = getCommand();

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

function getCommand() {
  if (gamePadObject.leftStickY <= -0.7) {
    return gemapadCommandMap.leftStickUp;
  } else if (gamePadObject.leftStickY >= 0.7) {
    return gemapadCommandMap.leftStickDown;
  } else if (gamePadObject.leftStickX <= -0.7) {
    return gemapadCommandMap.leftStickLeft;
  } else if (gamePadObject.leftStickX >= 0.7) {
    return gemapadCommandMap.leftStickRight;
  } else if (gamePadObject.rightStickY <= -0.7) {
    return gemapadCommandMap.rightStickUp;
  } else if (gamePadObject.rightStickY >= 0.7) {
    return gemapadCommandMap.rightStickDown;
  } else if (gamePadObject.rightStickX <= -0.7) {
    return gemapadCommandMap.rightStickLeft;
  } else if (gamePadObject.rightStickX >= 0.7) {
    return gemapadCommandMap.rightStickRight;
  }

  if (gamePadObject.LDT.pressed) {
    return gemapadCommandMap.LDT;
  } else if (gamePadObject.LDB.pressed) {
    return gemapadCommandMap.LDB;
  } else if (gamePadObject.LDL.pressed) {
    return gemapadCommandMap.LDL;
  } else if (gamePadObject.LDR.pressed) {
    return gemapadCommandMap.LDR;
  } else if (gamePadObject.L1.pressed) {
    return gemapadCommandMap.L1;
  } else if (gamePadObject.R1.pressed) {
    return gemapadCommandMap.R1;
  } else if (gamePadObject.L2.pressed) {
    return gemapadCommandMap.L2;
  } else if (gamePadObject.R2.pressed) {
    return gemapadCommandMap.R2;
  } else if (gamePadObject.L3.pressed) {
    return gemapadCommandMap.L3;
  } else if (gamePadObject.R3.pressed) {
    return gemapadCommandMap.R3;
  } else if (gamePadObject.opL.pressed) {
    return gemapadCommandMap.opL;
  } else if (gamePadObject.opR.pressed) {
    return gemapadCommandMap.opR;
  } else if (gamePadObject.RDT.pressed) {
    return gemapadCommandMap.RDT;
  } else if (gamePadObject.RDB.pressed) {
    return gemapadCommandMap.RDB;
  } else if (gamePadObject.RDL.pressed) {
    return gemapadCommandMap.RDL;
  } else if (gamePadObject.RDR.pressed) {
    return gemapadCommandMap.RDR;
  } else {
    return "STOP";
  }
}
