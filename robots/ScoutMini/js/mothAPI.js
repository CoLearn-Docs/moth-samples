// DOMElements
const inputHost = document.getElementById("inputHost");
const inputPort = document.getElementById("inputPort");
const inputChannel = document.getElementById("inputChannelName");

let APIOption = {
  host: "cobot.center",
  port: 8286,
  type: "sub",
  channel: null,
  isInstant: true,
  track: "colink",
  mode: "bundle",
};

// default
inputHost.value = "cobot.center";
inputPort.value = 8286;

function setAPIOption() {
  APIOption.host = inputHost.value;
  APIOption.port = inputPort.value;
  APIOption.channel = inputChannel.value;

  return APIOption;
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
