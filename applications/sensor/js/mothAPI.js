// DOMElements
const inputHost = document.getElementById("inputHost");
const inputPort = document.getElementById("inputPort");
const selectChannel = document.getElementById("selectChannel");
const inputChannel = document.getElementById("inputChannel");
const divMessage = document.getElementById("divMessage");
const buttonFindChannels = document.getElementById("buttonFindChannels");

document.addEventListener("DOMContentLoaded", async function () {
  buttonFindChannels.addEventListener("click", findChannels);
  selectChannel.addEventListener("change", selectedChannel);
});

let APIOption = {
  host: "cobot.center",
  port: 8287,
  type: null,
  channel: null,
  isInstant: true,
  track: "video",
};

// default
inputHost.value = "cobot.center";
inputPort.value = 8287;

function findChannels() {
  APIOption.host = inputHost.value;
  APIOption.port = inputPort.value;

  let channelAPI = getChannelAPI();

  selectChannel.options.length = 0;
  const option = document.createElement("option");
  option.text = "instant";
  option.value = "instant";
  selectChannel.append(option);

  fetch(channelAPI)
    .then((response) => response.json())
    .then((response) => {
      response.map((data) => {
        const option = document.createElement("option");
        if (data.state == 1) {
          option.text = data.name + "✔️ - in use";
        } else if (data.blocked) {
          option.text = data.name + "🚫 - blocked";
        } else {
          option.text = data.name;
        }
        option.value = data.id;

        selectChannel.append(option);
      });
      console.log(">> Channel found successful");
    })
    .catch((error) =>
      console.log(`>> Channel found failed, error message : ${error}`)
    );
}

function getChannelAPI() {
  let channelAPI;
  if (APIOption.port.substr(-1) == 7) channelAPI = "https://";
  else channelAPI = "http://";
  channelAPI += `${APIOption.host}:${APIOption.port}/monitor/http/cmd?format=json&op=show&obj=channel`;

  return channelAPI;
}

function selectedChannel() {
  let channel = selectChannel.options[selectChannel.selectedIndex].text;
  if (channel == "instant") {
    APIOption.isInstant = true;
    inputChannel.style.display = "flex";
  } else {
    APIOption.isInstant = false;
    inputChannel.style.display = "none";
  }
}

function setAPIOption() {
  APIOption.host = inputHost.value;
  APIOption.port = inputPort.value;
  if (APIOption.isInstant) APIOption.channel = inputChannel.value;
  else
    APIOption.channel =
      selectChannel.options[selectChannel.selectedIndex].value;

  return APIOption;
}

function setAPI(apiOption) {
  let url;

  if (APIOption.port.substr(-1) == 7) url = "wss://";
  else url = "ws://";
  url += `${apiOption.host}:${apiOption.port}/pang/ws/${apiOption.type}?`;

  if (apiOption.isInstant) url += `channel=instant&name=${apiOption.channel}`;
  else url += `channel=${apiOption.channel}`;

  if (apiOption.track) url += `&track=${apiOption.track}`;
  if (apiOption.mode) url += `&mode=${apiOption.mode}`;

  console.log(`>> API URL : ${url}`);

  return url;
}
