const inputWifiId = document.getElementById("inputWifiId");
const inputWifiPw = document.getElementById("inputWifiPw");

let device;
const deviceType = "RPI_BW_001";
const deviceNamePrefixMap = "BBC";
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

async function connectBluetoothDevice(prefix) {
  const options = {
    filters: [
      { namePrefix: prefix ?? undefined },
      { services: [UART_SERVICE_UUID] },
    ].filter(Boolean),
  };

  try {
    const device = await navigator.bluetooth.requestDevice(options);
    console.log(">> Found Bluetooth device: ", device);

    await device.gatt.connect();
    console.log(">> Connected to GATT server");

    return device;
  } catch (error) {
    console.error(error);
  }
}

async function sendNetworkConfigToBluetoothDevice() {
  device = await connectBluetoothDevice(deviceNamePrefixMap ?? undefined);
  if (device) {
    const metricData = {
      type: "metric",
      data: {
        server: {
          ssid: inputWifiId.value,
          password: inputWifiPw.value,
          host: inputHost.value,
          port:
            inputPort.value % 10 === 6
              ? inputPort.value
              : inputPort.value - (inputPort.value % 10) + 6,
          path: `pang/ws/pub?channel=instant&name=${inputChannel.value}&track=${APIOption.track}&mode=${APIOption.mode}`,
        },
        profile: deviceType,
      },
    };

    await sendMessageToDeviceOverBluetooth(
      JSON.stringify(metricData),
      device
    ).then(() => {
      console.log(">> Send network config to robot");
    });
  }
}

async function sendMessageToDeviceOverBluetooth(message, device) {
  console.log(">> Check message, device: ", message, device);
  const MAX_MESSAGE_LENGTH = 15;
  const messageArray = [];

  while (message.length > 0) {
    const chunk = message.slice(0, MAX_MESSAGE_LENGTH);
    message = message.slice(MAX_MESSAGE_LENGTH);
    messageArray.push(chunk);
  }

  if (messageArray.length > 1) {
    messageArray[0] = `${messageArray[0]}#${messageArray.length}$`;
    for (let i = 1; i < messageArray.length; i++) {
      messageArray[i] = `${messageArray[i]}$`;
    }
  }

  console.log(">> Connecting to GATT Server...");
  const server = await device.gatt.connect();

  console.log(">> Getting UART Service...");
  const service = await server.getPrimaryService(UART_SERVICE_UUID);

  console.log(">> Getting UART RX Characteristic...");
  const rxCharacteristic = await service.getCharacteristic(
    UART_RX_CHARACTERISTIC_UUID
  );

  if (rxCharacteristic.properties.write) {
    for (const chunk of messageArray) {
      try {
        await rxCharacteristic.writeValue(new TextEncoder().encode(chunk));
        console.log(`>> Message send: ${chunk}`);
      } catch (error) {
        console.error(`>> Error sending message: ${error}`);
      }
    }
  }
}
