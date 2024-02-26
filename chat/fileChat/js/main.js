// DomElement
const setNicknameContainer = document.getElementById("setNicknameContainer");
const buttonInitializeWebSocket = document.getElementById(
  "buttonInitializeWebSocket"
);
const buttonCloseWebsocket = document.getElementById("buttonCloseWebsocket");
const buttonSetNickname = document.getElementById("buttonSetNickname");
const buttonSendMessage = document.getElementById("buttonSendMessage");
const chatList = document.getElementById("chatList");
const inputFile = document.getElementById("inputFile");

// Variables
let websocket;
let nickname;
let interval;
let fileData;

document.addEventListener("DOMContentLoaded", async function () {
  buttonInitializeWebSocket.addEventListener("click", initializeWebSocket);
  buttonCloseWebsocket.addEventListener("click", closeWebsocket);
  buttonSetNickname.addEventListener("click", setNickname);
  buttonSendMessage.addEventListener("click", sendMessage);
  inputFile.addEventListener("change", handleFiles);
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

function handleFiles(event) {
  const fileName = event.target.files[0].name;

  fileData = {
    name: fileName,
  };

  let fileReader = new FileReader();
  fileReader.readAsDataURL(inputFile.files[0]);

  fileReader.addEventListener("load", (e) => {
    fileSrc = e.target.result;
    if (
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif")
    ) {
      fileData.type = "image";
      fileData.data = fileSrc;
    } else {
      fileData.type = "file";
      fileData.data = fileSrc;
    }
  });

  fileReader.addEventListener("error", (error) =>
    console.error(">> Error reading file:", error)
  );

  fileReader.addEventListener("abort", (event) =>
    console.log(">> File reading aborted:", event)
  );
}

async function sendMessage() {
  if (!websocket) {
    alert("Please set up the web socket and open it");
    return;
  }

  const messageJson = {
    name: nickname,
    file: fileData,
    time: currentTime(),
  };

  if (inputFile.value !== "" || inputFile.value !== null) {
    websocket.send(new TextEncoder().encode(JSON.stringify(messageJson)));
    displayMyMessage(messageJson);
    inputFile.value = "";
  }
}

function displayMyMessage(messageJson) {
  const div = document.createElement("div");
  div.className = "chat-box-my";

  if (messageJson.file.type === "image") {
    div.innerHTML = `
                        <a href="${messageJson.file.data}" download="${messageJson.file.name}">
                        <img src="${messageJson.file.data}"/>
                        </a>
                    
                    <p>${messageJson.time}</p>`;
  } else {
    div.innerHTML = `
                          <a href="${messageJson.file.data}" download="${messageJson.file.name}">
                            <div>${messageJson.file.name}</div>
                          </a>
                      
                      <p>${messageJson.time}</p>`;
  }

  chatList.appendChild(div);

  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
}

function displayYourMessage(messageJson) {
  const div = document.createElement("div");
  div.className = "chat-box-your";

  if (messageJson.file.type === "image") {
    div.innerHTML = `
                          <a href="${messageJson.file.data}" download="${messageJson.file.name}">
                          <img src="${messageJson.file.data}"/>
                          </a>
                      
                    <p>${messageJson.name} - ${messageJson.time}</p>`;
  } else {
    div.innerHTML = `
                          <a href="${messageJson.file.data}" download="${messageJson.file.name}">
                            <div>${messageJson.file.name}</div>
                          </a>
                      
                      <p>${messageJson.name} - ${messageJson.time}</p>`;
  }
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
