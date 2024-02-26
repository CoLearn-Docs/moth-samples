// DOMElements
const inputHost = document.getElementById("inputHost");
const inputPort = document.getElementById("inputPort");
const inputChannel = document.getElementById("inputChannelName");
const inputHostAddVideo = document.getElementById("inputAddVideoHost");
const inputPortAddVideo = document.getElementById("inputAddVideoPort");
const inputChannelAddVideo = document.getElementById(
  "inputAddVideoChannelName"
);

let controlAPIOption = {
  host: "cobot.center",
  port: 8286,
  type: "sub",
  channel: null,
  isInstant: true,
  track: "colink",
  mode: "bundle",
};

let videoAPIOption = {
  host: "cobot.center",
  port: 8286,
  type: "sub",
  channel: null,
  isInstant: true,
  track: "video",
  mode: "single",
};

// default
inputHost.value = "cobot.center";
inputPort.value = 8286;
inputAddVideoHost.value = "cobot.center";
inputAddVideoPort.value = 8286;

function setControlAPIOption() {
  controlAPIOption.host = inputHost.value;
  controlAPIOption.port = inputPort.value;
  controlAPIOption.channel = inputChannel.value;

  return controlAPIOption;
}

function setVideoAPIOption() {
  videoAPIOption.host = inputHostAddVideo.value;
  videoAPIOption.port = inputPortAddVideo.value;
  videoAPIOption.channel = inputChannelAddVideo.value;

  return videoAPIOption;
}

function setAPI(apiOption) {
  let url = apiOption.port % 10 === 7 ? "wss://" : "ws://";
  url += `${apiOption.host}:${apiOption.port}/pang/ws/${apiOption.type}?`;

  url += apiOption.isInstant
    ? `channel=instant&name=${apiOption.channel}`
    : `channel=${apiOption.channel}`;

  url += apiOption.track ? `&track=${apiOption.track}` : "";
  url += apiOption.mode ? `&mode=${apiOption.mode}` : "";

  console.log(`>> API URL : ${url}`);

  return url;
}
