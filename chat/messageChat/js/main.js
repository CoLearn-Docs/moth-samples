// DomElement
const setNicknameContainer = document.getElementById("setNicknameContainer");
const buttonInitializeWebSocket = document.getElementById(
  "buttonInitializeWebSocket"
);
const buttonCloseWebsocket = document.getElementById("buttonCloseWebsocket");
const buttonSetNickname = document.getElementById("buttonSetNickname");
const inputMessage = document.getElementById("inputMessage");
const buttonSendMessage = document.getElementById("buttonSendMessage");
const chatList = document.getElementById("chatList");

// Variables
let websocket;
let nickname;
let interval;

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeWebSocket.addEventListener("click", initializeWebSocket);
  buttonCloseWebsocket.addEventListener("click", closeWebsocket);
  buttonSetNickname.addEventListener("click", setNickname);
  buttonSendMessage.addEventListener("click", sendMessage);
  inputMessage.addEventListener("keydown", (event) => {
    if (event.keyCode === 13) sendMessage();
  });
});

function setNickname() {
  nickname = document.getElementById("inputNickname").value;
}

function initializeWebSocket() {
  if (websocket) return;

  const apiOption = setAPIOption();
  websocket = new WebSocket(setAPI(apiOption));
  websocket.binaryType = "arraybuffer";

  websocket.onopen = () => {
    console.log(">> Open Websocket");
    interval = setInterval(() => {
      websocket.send("text/json");
    }, 10000);
  };

  websocket.onclose = () => {
    console.log(">> Close Websocket");
  };

  websocket.onerror = (error) => {
    console.log(">> Error Websocket", error);
  };

  websocket.onmessage = (event) => {
    if (typeof event.data == "object") {
      const messageJson = JSON.parse(new TextDecoder().decode(event.data));
      displayYourMessage(messageJson);
    }
  };
}

function closeWebsocket() {
  if (!websocket) return;

  clearInterval(interval);
  websocket.close();
  websocket = null;
}

function sendMessage() {
  if (!websocket) {
    alert("Please set up the web socket and open it");
    return;
  }

  const messageJson = {
    name: nickname,
    message: inputMessage.value,
    time: currentTime(),
  };

  if (inputMessage.value !== "" || inputMessage.value !== null) {
    websocket.send(new TextEncoder().encode(JSON.stringify(messageJson)));
    displayMyMessage(messageJson);
    inputMessage.value = "";
  }
}

function displayMyMessage(messageJson) {
  const div = document.createElement("div");
  div.className = "chat-box-my";
  div.innerHTML = `<pre>${messageJson.message}</pre>
                   <p>${messageJson.time}</p>`;
  chatList.appendChild(div);

  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
}

function displayYourMessage(messageJson) {
  const div = document.createElement("div");
  div.className = "chat-box-your";
  div.innerHTML = `<pre>${messageJson.message}</pre>
                   <p>${messageJson.name} - ${messageJson.time}</p>`;
  chatList.appendChild(div);

  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
}

function currentTime() {
  const today = new Date();
  const hours = String(today.getHours()).padStart(2, "0");
  const minutes = String(today.getMinutes()).padStart(2, "0");

  return `${hours} : ${minutes}`;
}
