<template>
  <div class="background">
    <div class="disconnected overlay" v-if="!connected">
      <div class="info-large">
        <strong>
          Plug in your eChook Nano via USB or connect via Bluetooth
          <p>then</p>
        </strong>
      </div>
      <p><button class="connect-button" @click="connect">Connect</button></p>
      <div class="demo-trigger" @click="mockConnect">Demo Mode</div>
      <p> Only <strong>Chrome</strong> and <strong>Edge</strong> Desktop Browsers Supported</p>
    </div>
    <!-- <button v-if="connected" @click="serialRequestAllCal">
      Get Calibration
    </button> -->
    <!-- <button v-if="connected" @click="serialSendBinaryData">Send Binary</button> -->
    <!-- <button v-if="connected" @click="serialToggleData">Toggle Data</button> -->
    <!-- <h2>
      {{
        connected
          ? waitingForData
            ? "Waiting for Data..."
            : "Connected"
          : "Disconnected"
      }}
    </h2> -->
    <div v-if="connected && waitingForData" class="lds-grid">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div v-if="connected && waitingForData">
      {{ inputBuffer }}
    </div>
    <div class="ca" v-if="connected && !waitingForData">
      <div class="values-container two-col">
        <div class="top-controls">
          <div class="value-container ca">
            <div class="value-title">Device Information</div>
            <div class="live-calibration" v-bind:class="{ changed: eChook.bluetoothName.changed }">
              <div class="title">Name</div>
              <input class="cal-input" type="text" @input="checkChange" v-model="eChook.bluetoothName.value" />
            </div>
            <div class="live-calibration" v-if="protocolVersion === 2">
              <div class="title">Hardware</div>
              <div class="cal-input"
                style="border:none; padding-top:4px; font-weight:bold; background-color:transparent;">{{ deviceType }}
              </div>
            </div>
          </div>

          <div class="value-container binary ca">
            <div class="value-title">Setting Toggles</div>
            <template v-for="(item, itemKey) in eChook.binary" v-bind:key="`binary-${itemKey}`">
              <div v-if="!item.hidden" class="binary-cal-container" v-bind:class="{ changed: item.changed }">
                <div class="title">{{ item.name }}</div>
                <div class="binary-option" @click="
                  item.value = 1;
                checkChange();
                " v-bind:class="{ active: item.value }">
                  {{ item.op1 }}
                </div>
                <div class="binary-option" @click="
                  item.value = 0;
                checkChange();
                " v-bind:class="{ active: !item.value }">
                  {{ item.op2 }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="cards-grid">
          <div class="cards-column left-column">
            <template v-for="entry in leftColumnItems" v-bind:key="`nc-${entry.key}`">
              <div class="value-container compact-card">
                <div class="value-title">{{ entry.item.title }}</div>
                <div v-if="entry.item.value != null" class="live-value">
                  {{ entry.item.value }} {{ entry.item.units }}
                </div>
              </div>
            </template>
          </div>

          <div class="cards-column right-column">
            <template v-for="entry in rightColumnItems" v-bind:key="`c-${entry.key}`">
              <div class="value-container calibratable-card">
                <div class="value-title">{{ entry.item.title }}</div>
                <div class="calibratable-layout">
                  <div class="live-value live-value-square">
                    <span class="reading-value">{{ entry.item.value != null ? entry.item.value : "--" }}</span>
                    <span v-if="entry.item.units" class="reading-unit">{{ entry.item.units }}</span>
                  </div>
                  <div class="calibration-stack">
                    <template v-for="(cal, calKey) in entry.item.calibration" v-bind:key="`${entry.key}-${calKey}`">
                      <div
                        v-if="cal.floatIndex != null || cal.name"
                        class="live-calibration"
                        v-bind:class="{ changed: cal.changed }">
                        <div class="title">{{ cal.name }}:</div>
                        <input class="cal-input" @input="checkChange" type="number" step="any" v-model="cal.value" />
                        <div>{{ cal.unit }}</div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div style="height: 100px"></div>
      <div class="bottom-menu">
        <div @click="disconnectPort" class="button disconnect">Disconnect</div>
        <div @click="resetEchook" class="button disconnect">Reset eChook</div>
        <div class="button" @click="backupDownload">Backup Config</div>
        <div class="button" onclick="document.getElementById('fileButton').click();">
          <input id="fileButton" style="display: none" type="file" ref="jsonFile" @change="backupRestore" />
          Restore Backup
        </div>
        <div class="button send-data" @click="serialSendAllCal">
          {{ sendCalText }}
        </div>
      </div>
    </div>
  </div>

  <!-- Calibration Tools -->
  <div class="tools-background" v-if="tools">
    <div class="tools-container">
      <div class="title">Calibration Tools</div>
    </div>

  </div>
</template>

<script>
import * as ext from "../scripts/dataTemplate.js";
// console.log(`imported: ${JSON.stringify(ext.dataTemplate.eChook)}`);
export default {
  data() {
    return {
      tools: 0,
      dataIn: "Starting String",
      hasSerial: 0,
      connected: false,
      waitingForData: true,
      connectFailed: false,
      connectColor: "primary",
      connectText: "connect",
      writeFailed: false,
      port: null,
      inputField: null,
      inputStream: null,
      inputDone: null,
      outputStream: null,
      outputDone: null,
      reader: null,
      writer: null,
      running: true,
      inputBuffer: null,
      changeCount: 0,
      serialCalibration: {
        dataPacketLength: 5,
        binaryCalArrayLength: 10,
        binaryCalIdentifier: "b",
        floatCalArrayLength: 83,
        floatCalIdentifier: "f",
        btNameArrayLength: 33,
        btNameIdentifier: "n",
        versionIdentifier: "v",
      },
      protocolVersion: 1,
      deviceType: "Unknown",
      ackResolver: null,
      eChook: {},
    };
  },
  created() {
    if ("serial" in navigator) {
      this.hasSerial = true;
    }
  },
  mounted() {
    // Copy external data template to the Vue data object
    this.eChook = ext.dataTemplate.eChook;
  },
  computed: {
    sendCalText() {
      let text = "";
      if (!this.changeCount) {
        text = `No Changes`;
      } else if (this.changeCount === 1) {
        text = `Send 1 Change to eChook`;
      } else {
        text = `Send ${this.changeCount} Changes to eChook`;
      }
      return text;
    },
    orderedDisplayItems() {
      const priorityOrder = [
        "speed",
        "current",
        "voltage",
        "voltageLower",
        "rpm",
        "throttleInput",
        "throttleActual",
        "throttleVoltage",
        "temp1",
        "temp2",
        "temp3",
        "referenceVoltage",
        "referenceVoltageStatic",
        "transmitInterval",
        "gearRatio",
        "brakePressed",
        "launchMode",
        "cycleView",
      ];

      const priorityMap = {};
      for (let i = 0; i < priorityOrder.length; i++) {
        priorityMap[priorityOrder[i]] = i;
      }

      return Object.entries(this.eChook)
        .filter(([_, item]) => {
          return item.title && !item.hidden && !(this.deviceType === "Nano Every" && item.title === "Reference Voltage");
        })
        .map(([key, item]) => ({ key, item }))
        .sort((a, b) => {
          const aPriority = Object.prototype.hasOwnProperty.call(priorityMap, a.key) ? priorityMap[a.key] : 999;
          const bPriority = Object.prototype.hasOwnProperty.call(priorityMap, b.key) ? priorityMap[b.key] : 999;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.item.title.localeCompare(b.item.title);
        });
    },
    leftColumnItems() {
      return this.orderedDisplayItems.filter(({ item }) => !item.calibratable);
    },
    rightColumnItems() {
      return this.orderedDisplayItems.filter(({ item }) => item.calibratable);
    },
  },
  methods: {
    checkChange() {
      this.changeCount = 0;

      //Checks for changes from fetched calibration

      // Binary Values:
      for (let item in this.eChook.binary) {
        let tmp = this.eChook.binary[item];
        if (tmp.value != tmp.old) {
          // console.log(`Binary change in ${tmp.name}`);
          tmp.changed = 1;
          this.changeCount++;
          // console.log(`tmpVal: ${tmp.value}, oldVal: ${tmp.old}`);
        } else {
          tmp.changed = 0;
        }
      }

      // Float Values
      for (let item in this.eChook) {
        let tempChook = this.eChook[item];
        if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
          for (let cal in tempChook.calibration) {
            let c = tempChook.calibration[cal];
            if (c.value != c.old) {
              // console.log(`Float Change in ${c.name}`);
              c.changed = 1;
              this.changeCount++;
            } else {
              c.changed = 0;
            }
          }
        } else if (item === "bluetoothName") {
          if (this.eChook[item].value != this.eChook[item].old) {
            this.eChook[item].changed = 1;
            this.changeCount++;
          } else {
            this.eChook[item].changed = 0;
          }
        }
      }
    },
    async connect() {
      this.connected = false;
      this.connectFailed = false;
      try {
        this.port = await navigator.serial.requestPort();
      } catch (error) {
        console.log("No port selected");
        return;
      }
      // - Wait for the port to open.
      try {
        await this.port.open({ baudRate: 115200 });
      } catch (error) {
        console.log("*** open port error ***");
        console.log(error);
        if (!window.alert(`Failed to open Serial Port\n\n${error}`)) {
          window.location.reload();
        }
        this.connectFailed = true;
      }
      // Check for success and continue
      if (!this.connectFailed) {
        this.inputBuffer = new Uint8Array(0);
        this.connected = true;
        console.log("Open");
        setTimeout(() => {
          this.serialRequestSWVersion(); // Starts V2 negotiation & legacy request
          this.serialRequestFloatCal();
        }, 300);

        this.reader = this.port.readable.getReader();
        // this.writer = this.port.writable.getWriter();
        this.closed = this.readLoop();
      }
    },
    mockConnect() {
      this.connected = true;
      this.waitingForData = false;
      this.protocolVersion = 2;
      this.deviceType = "Mock eChook Nano";

      // Populate some dummy data
      this.eChook.bluetoothName.value = "Demo-Device-01";
      this.eChook.bluetoothName.old = "Demo-Device-01";
      this.eChook.binary.variableThrottle.value = 1;
      this.eChook.binary.variableThrottle.old = 1;
      this.eChook.binary.throttleOut.value = 1;
      this.eChook.binary.throttleOut.old = 1;

      // Populate some calibration values
      if (this.eChook.speed && this.eChook.speed.calibration) {
        this.eChook.speed.calibration.magnets.value = 2;
        this.eChook.speed.calibration.magnets.old = 2;
        this.eChook.speed.calibration.circumference.value = 1.57;
        this.eChook.speed.calibration.circumference.old = 1.57;
        this.eChook.speed.value = "12.50";
      }
      if (this.eChook.voltage) {
        this.eChook.voltage.value = "25.40";
        if (this.eChook.voltage.calibration) {
          this.eChook.voltage.calibration.multiplier.value = 11.0;
          this.eChook.voltage.calibration.multiplier.old = 11.0;
        }
      }
      if (this.eChook.current) {
        this.eChook.current.value = "15.20";
        if (this.eChook.current.calibration) {
          this.eChook.current.calibration.multiplier.value = 0.05;
          this.eChook.current.calibration.multiplier.old = 0.05;
        }
      }

      this.checkChange();
      console.log("Mock Connection Started");
    },
    resetEchook() {
      if (confirm("This will revert your eChook to default settings. Once done, unplug then reconnect the eChook")) {
        if (this.protocolVersion === 2) {
          this.serialWriteV25(0x45, new Uint8Array(0));
        } else {
          let data = new Uint8Array(2);
          let text = "C"; // Clear EEPROM
          data[0] = text.charCodeAt(0);
          this.serialWrite(data);
        }
      }
    },
    async disconnectPort() {
      window.location.reload();
    },
    async readLoop() {
      console.log(`Entering ReadLoop`);

      while (this.running) {
        const { value, done } = await this.reader.read();
        this.inputBuffer = this.concatenate(this.inputBuffer, value);

        let found = 1;
        while (found) {
          found = 0;

          // Check for V2+ Packet
          if (this.inputBuffer.length >= 5) {
            for (let i = 0; i <= this.inputBuffer.length - 5; i++) {
              if (this.inputBuffer[i] === 0xAA) {
                let type = this.inputBuffer[i + 1];
                let len = this.inputBuffer[i + 2];
                if (this.inputBuffer.length >= i + 3 + len + 2) {
                  // Full packet received
                  let calcCrc = type ^ len;
                  let crcIdx = i + 3 + len;
                  for (let d = 0; d < len; d++) {
                    calcCrc ^= this.inputBuffer[i + 3 + d];
                  }
                  if (this.inputBuffer[crcIdx] === calcCrc && this.inputBuffer[crcIdx + 1] === 0x55) {
                    this.protocolVersion = 2;

                    this.handleV25Packet(type, this.inputBuffer.slice(i + 3, i + 3 + len));
                    this.inputBuffer = this.concatenate(this.inputBuffer.slice(0, i), this.inputBuffer.slice(crcIdx + 2));
                    found = 1;
                    break; // Break loop to re-evaluate new buffer length
                  }
                }
              }
            }
          }
          if (found) continue;

          if (this.inputBuffer.length > 4) {
            //Only look if input buffer is long enough to contain at least one packet.
            for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
              if (String.fromCharCode(this.inputBuffer[i]) === "}") {
                // Looking for eChook data Packet
                //End brace for data packet found
                if (String.fromCharCode(this.inputBuffer[i - 4]) === "{") {
                  // Packet Found
                  let id = this.inputBuffer[i - 3];
                  let byte1 = this.inputBuffer[i - 2];
                  let byte2 = this.inputBuffer[i - 1];
                  this.eChookDataDecode(id, byte1, byte2);
                  found = 1;
                  this.inputBuffer = this.concatenate(
                    this.inputBuffer.slice(0, i - 4),
                    this.inputBuffer.slice(i + 1, this.inputBuffer.length)
                  ); // Remove the interpreted packet from the buffer
                  i = -1; // Exit the for loop and search again from the top.
                }
              }

              //Looking for Calibration Packet
              if (String.fromCharCode(this.inputBuffer[i]) === "]") {
                //End brace for calibration packet found
                // Now check for float Cal
                if (
                  this.inputBuffer.length >
                  this.serialCalibration.floatCalArrayLength
                ) {
                  //look for float calibration array:
                  if (
                    String.fromCharCode(
                      this.inputBuffer[
                      i - this.serialCalibration.floatCalArrayLength + 1
                      ]
                    ) === "["
                  ) {
                    // Packet Found, verify with ID character:
                    if (
                      String.fromCharCode(
                        this.inputBuffer[
                        i - this.serialCalibration.floatCalArrayLength + 2
                        ]
                      ) === this.serialCalibration.floatCalIdentifier
                    ) {
                      // Pull the float data out into an array:
                      let calArray = new Uint8Array();
                      calArray = this.inputBuffer.slice(
                        i - this.serialCalibration.floatCalArrayLength + 3,
                        i
                      );
                      this.eChookFloatCalDecode(calArray);
                      found = 1;

                      // Remove the interpreted packet from the buffer
                      this.inputBuffer = this.concatenate(
                        this.inputBuffer.slice(
                          0,
                          i - this.serialCalibration.floatCalArrayLength
                        ),
                        this.inputBuffer.slice(i, this.inputBuffer.length)
                      );
                      i = -1; // Exit the for loop and search again from the top.
                    }
                  }
                }
                // Look for Binary cal array
                if (
                  this.inputBuffer.length >
                  this.serialCalibration.binaryCalArrayLength
                ) {
                  if (
                    String.fromCharCode(
                      this.inputBuffer[
                      i - this.serialCalibration.binaryCalArrayLength + 1
                      ]
                    ) === "["
                  ) {
                    //Binary cal start bracket found
                    // console.log(`Found Binary Settings Start Bracket`);
                    if (
                      String.fromCharCode(
                        this.inputBuffer[
                        i - this.serialCalibration.binaryCalArrayLength + 2
                        ]
                      ) === this.serialCalibration.binaryCalIdentifier
                    ) {
                      // Pull the float data out into an array:
                      let calArray = new Uint8Array();
                      calArray = this.inputBuffer.slice(
                        i - this.serialCalibration.binaryCalArrayLength + 3,
                        i
                      );
                      console.log(`Binary Array Length: ${calArray.length}`);
                      console.log(`Binary Array Identified as: ${calArray}`);
                      this.eChookBinaryCalDecode(calArray);
                      found = 1;

                      // Remove the interpreted packet from the buffer
                      this.inputBuffer = this.concatenate(
                        this.inputBuffer.slice(
                          0,
                          i - this.serialCalibration.binaryCalArrayLength
                        ),
                        this.inputBuffer.slice(i, this.inputBuffer.length)
                      );
                      i = -1; // Exit the for loop and search again from the top.
                    }
                  }
                } // /look for binary cal
                // Look for Name cal array
                if (
                  this.inputBuffer.length >
                  this.serialCalibration.btNameArrayLength
                ) {
                  if (
                    String.fromCharCode(
                      this.inputBuffer[
                      i - this.serialCalibration.btNameArrayLength + 1
                      ]
                    ) === "["
                  ) {
                    //Binary cal start bracket found
                    // console.log(`Found Binary Settings Start Bracket`);
                    if (
                      String.fromCharCode(
                        this.inputBuffer[
                        i - this.serialCalibration.btNameArrayLength + 2
                        ]
                      ) === this.serialCalibration.btNameIdentifier
                    ) {
                      // Pull the float data out into an array:
                      let calArray = new Uint8Array();
                      calArray = this.inputBuffer.slice(
                        i - this.serialCalibration.btNameArrayLength + 3,
                        i
                      );
                      // console.log(`Binary Array Length: ${calArray.length}`);
                      // console.log(`Binary Array Identified as: ${calArray}`);
                      this.eChookNameCalDecode(calArray);
                      found = 1;

                      // Remove the interpreted packet from the buffer
                      this.inputBuffer = this.concatenate(
                        this.inputBuffer.slice(
                          0,
                          i - this.serialCalibration.btNameArrayLength
                        ),
                        this.inputBuffer.slice(i, this.inputBuffer.length)
                      );
                      i = -1; // Exit the for loop and search again from the top.
                    }
                  }
                } // /look for Name cal
              }
            }
          }
          if (found === 0) {
            // No More data has been found, if no calibration data start bits are found ('[') we can clear the buffer
            let startBits = 0;
            if (this.inputBuffer.length > 4) {
              for (let i = this.inputBuffer.length - 4; i >= 0; i--) {
                //-4 to skip any half formed data packets at the start of the buffer
                if (String.fromCharCode(this.inputBuffer[i]) === "[") {
                  startBits = 1;
                }
              }
              if (!startBits) {
                //Clear all but last 4 bytes of buffer
                // this.inputBuffer = this.inputBuffer.slice(
                //   this.inputBuffer.length - 5,
                //   this.inputBuffer.length
                // );
              }
            }
          }
        }
      }
    },
    concatenate(...arrays) {
      let totalLength = 0;
      for (const arr of arrays) {
        totalLength += arr.length;
      }
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    },
    eChookDataDecode(id, byte1, byte2) {
      if (this.waitingForData) {
        // Requested here as incoming data indicates serial connection alive (iirc!)
        this.waitingForData = 0;
        // this.serialRequestAllCal();
        this.serialRequestSWVersion();
        this.serialRequestFloatCal();
        this.serialRequestBinaryCal();
        this.serialRequestBTName();
      }
      let value = 0;
      id = String.fromCharCode(id);

      //Decode Numbers:
      if (byte1 > 128) {
        //Integer Value
        let hundreds = (byte1 - 128) * 100;
        let tens = byte2;
        value = hundreds + tens;
      } else {
        //Float Value
        let intVal = 0;
        intVal = byte1;
        let decimal = 0;
        decimal = Number(byte2) / 100;
        value = Number(Number(intVal) + Number(decimal));
      }

      //   now update relevant value
      for (let i in this.eChook) {
        if (this.eChook[i].identifier === id) {
          this.eChook[i].value = value.toFixed(this.eChook[i].precision);
        }
      }
    },
    eChookFloatCalDecode(calArray) {
      let view = new DataView(calArray.buffer);

      for (
        let i = 0;
        i < this.serialCalibration.floatCalArrayLength - 5;
        i = i + 4
      ) {
        let output = view.getFloat32(i, 1);
        // console.log(`Float ${i / 4} read as ${output}`);

        //   Now a long winded asign calibration routine.
        let index = i / 4;

        // new assignment routine
        for (let item in this.eChook) {
          // console.log(`Looking in ${this.eChook[item].title}`);
          let tempChook = this.eChook[item];
          if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
            for (let cal in tempChook.calibration) {
              let c = tempChook.calibration[cal];
              if (c.floatIndex === index) {
                c.value = output.toFixed(c.precision);
                c.old = c.value;
                // console.log(`Stringified: ${JSON.stringify(c)}`);
                // console.log(`Checking index ${tempChook.title}, ${c.name}`);
              }
            }
          }
        }
      }
      this.checkChange();
    },
    eChookBinaryCalDecode(calArray) {
      // No way to split and asign this automatically at the moment...

      // console.log(`Entering binary decode: ${calArray}`);

      let CAL_A = calArray[0];
      let CAL_B = calArray[1];
      let CAL_C = calArray[2];
      let CAL_D = calArray[3];

      // this.eChook.binary.useHardcoded.value = CAL_A & 0x80;
      // this.eChook.binary.useHardcoded.old = CAL_A & 0x80;

      this.eChook.binary.variableThrottle.value = CAL_A & 0x40 ? 1 : 0;
      this.eChook.binary.variableThrottle.old = CAL_A & 0x40 ? 1 : 0;

      this.eChook.binary.linearTempSensor.value = CAL_A & 0x20 ? 1 : 0;
      this.eChook.binary.linearTempSensor.old = CAL_A & 0x20 ? 1 : 0;

      this.eChook.binary.throttleOut.value = CAL_A & 0x10 ? 1 : 0;
      this.eChook.binary.throttleOut.old = CAL_A & 0x10 ? 1 : 0;

      this.eChook.binary.throttleRamp.value = CAL_A & 0x08 ? 1 : 0;
      this.eChook.binary.throttleRamp.old = CAL_A & 0x08 ? 1 : 0;

      // this.eChook.binary.useHardcoded = CAL_A & 0x80;
      // this.eChook.binary.useHardcodedOld = CAL_A & 0x80;
      this.checkChange();
    },
    eChookNameCalDecode(calArray) {
      let tmpName = "";
      console.log(`Name Array Length: ${calArray.length}`);

      for (let i = 0; i < this.serialCalibration.btNameArrayLength - 3; i++) {
        if (calArray[i] && calArray[i] != 0xff) {
          console.log(`Cal array ${i}: ${calArray[i]}`);
          tmpName += String.fromCharCode(calArray[i]);
        }
      }

      this.eChook.bluetoothName.value = tmpName;
      this.eChook.bluetoothName.old = tmpName;
      this.checkChange();
    },
    //Serial Write Functions
    serialWrite(data) {
      try {
        this.writer = this.port.writable.getWriter();
      } catch (e) {
        console.log(`Failed to open Write Stream`);
      }
      this.writer.write(data);
      this.writer.releaseLock();
    },
    serialWriteV25(type, dataArray) {
      let len = dataArray.length;
      let buf = new Uint8Array(len + 5);
      buf[0] = 0xAA;
      buf[1] = type;
      buf[2] = len;
      let crc = type ^ len;
      for (let i = 0; i < len; i++) {
        buf[3 + i] = dataArray[i];
        crc ^= dataArray[i];
      }
      buf[3 + len] = crc;
      buf[4 + len] = 0x55;
      this.serialWrite(buf);
    },
    handleV25Packet(type, data) {
      if (type === 0x81) {
        if (data.length >= 6) {
          this.deviceType = data[5] === 1 ? "Nano Every" : "Standard Nano";
        }
        if (this.waitingForData) {
          this.waitingForData = 0;
          this.serialRequestFloatCal();
          this.serialRequestBinaryCal();
          this.serialRequestBTName();
        }
      } else if (type === 0x82) {
        this.eChookFloatCalDecode(data);
      } else if (type === 0x83) {
        this.eChookBinaryCalDecode(data);
      } else if (type === 0x84) {
        this.eChookNameCalDecode(data);
      } else if (type === 0xFC) {
        if (this.ackResolver) { this.ackResolver(); this.ackResolver = null; }
      }
    },
    serialRequestAllCal() {
      this.serialRequestSWVersion();
      this.serialRequestFloatCal();
      this.serialRequestBinaryCal();
      this.serialRequestBTName();
    },
    serialRequestBTName() {
      if (this.protocolVersion === 2) { this.serialWriteV25(0x04, new Uint8Array(0)); return; }
      let data = new Uint8Array(2);
      let text = "gn"; // Request Hardware version
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestSWVersion() {
      this.serialWriteV25(0x01, new Uint8Array(0)); // Negotiation Attempt
      let data = new Uint8Array(2);
      let text = "gv"; // Request Software version
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestBinaryCal() {
      if (this.protocolVersion === 2) { this.serialWriteV25(0x03, new Uint8Array(0)); return; }
      let data = new Uint8Array(2);
      let text = "gb"; // Request  Binary cal data
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestFloatCal() {
      if (this.protocolVersion === 2) { this.serialWriteV25(0x02, new Uint8Array(0)); return; }
      let data = new Uint8Array(2);
      let text = "gf"; // Request Float cal data
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialToggleData() {
      let data = new Uint8Array(2);
      let text = "gd";
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    async serialSendAllCal() {
      if (this.protocolVersion === 2) {
        await this.serialSendBinaryData();
        await this.serialSendFloatData();
        await this.serialSendBtName();
      } else {
        this.serialSendBinaryData();
        setTimeout(() => { this.serialSendFloatData(); }, 400);
        setTimeout(() => { this.serialSendBtName(); }, 800);
      }
    },
    async serialSendBtName() {
      if (
        this.eChook.bluetoothName.value != null &&
        this.eChook.bluetoothName.value.length <= 30
      ) {
        if (this.protocolVersion === 2) {
          let str = this.eChook.bluetoothName.value;
          let data = new Uint8Array(30);
          data.fill(0xff);
          for (let i = 0; i < str.length; i++) data[i] = str.charCodeAt(i);
          return new Promise(resolve => {
            this.ackResolver = resolve;
            this.serialWriteV25(0x44, data);
            setTimeout(resolve, 1000); // Resume if no ACK
          });
        }

        let data = new Uint8Array(32);
        data.fill(0xff);
        let text = "sn"; //Set Name
        data[0] = text.charCodeAt(0);
        data[1] = text.charCodeAt(1);
        for (let i = 0; i < this.eChook.bluetoothName.value.length; i++) {
          data[i + 2] = this.eChook.bluetoothName.value.charCodeAt(i);
        }
        this.serialWrite(data);
      }
    },
    async serialSendFloatData() {
      let floatData = new Float32Array(20);
      let view = new DataView(floatData.buffer);

      for (let item in this.eChook) {
        let tempChook = this.eChook[item];
        if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
          for (let cal in tempChook.calibration) {
            let c = tempChook.calibration[cal];
            if (c.floatIndex != null) {
              view.setFloat32(c.floatIndex * 4, c.value, true);
            }
          }
        }
      }

      let data = new Uint8Array(view.buffer);
      if (this.protocolVersion === 2) {
        return new Promise(resolve => {
          this.ackResolver = resolve;
          this.serialWriteV25(0x42, data);
          setTimeout(resolve, 1000);
        });
      }

      let command = new Uint8Array(2);
      let text = "sf"; //Set Name
      command[0] = text.charCodeAt(0);
      command[1] = text.charCodeAt(1);

      this.serialWrite(command);
      this.serialWrite(data);
    },
    async serialSendBinaryData() {
      let payloadByte = 0;
      if (this.eChook.binary.variableThrottle.value) payloadByte |= 0x40;
      if (this.eChook.binary.linearTempSensor.value) payloadByte |= 0x20;
      if (this.eChook.binary.throttleOut.value) payloadByte |= 0x10;
      if (this.eChook.binary.throttleRamp.value) payloadByte |= 0x08;

      if (this.protocolVersion === 2) {
        return new Promise(resolve => {
          this.ackResolver = resolve;
          this.serialWriteV25(0x43, new Uint8Array([payloadByte, 0, 0, 0]));
          setTimeout(resolve, 1000);
        });
      }

      let data = new Uint8Array(6);
      data.fill(0);
      data[2] = payloadByte;

      let command = "sb";
      data[0] = command.charCodeAt(0);
      data[1] = command.charCodeAt(1);

      this.serialWrite(data);
    },
    backupDownload() {
      let backup = JSON.stringify(this.eChook);
      let filename = `eChook Cal - ${this.eChook.bluetoothName.value
        } - ${this.getDmyString(new Date())}.ecb`;

      var blob = new Blob([backup], {
        type: "text/json;charset=utf-8;",
      });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
      } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    },
    async backupRestore() {
      // var t = this;
      console.log(`Entering Restore`);

      // var localFile = $refs.jsonFile.files[0];
      const [file] = document.querySelector("input[type=file]").files;
      let reader = new FileReader();

      reader.addEventListener("load", () => {
        // console.log(`File Loaded`);
        // console.log(`File Imported \n ${reader.result}`);
        // Now to check and restore backup...
        let newCal = JSON.parse(reader.result);
        for (let item in this.eChook) {
          if (Object.hasOwn(newCal, item)) {
            if (item === "binary") {
              for (let sub in this.eChook[item]) {
                if (Object.hasOwn(newCal[item], sub)) {
                  this.eChook[item][sub].value = newCal[item][sub].value ? 1 : 0;
                }
              }
            } else if (item === "bluetoothName") {
              if (Object.hasOwn(newCal[item], 'value')) {
                this.eChook[item].value = newCal[item].value;
              }
            } else if (Object.hasOwn(newCal[item], "calibration")) {
              // console.log(`Cal object Found`);
              for (let cal in this.eChook[item].calibration) {
                // console.log(
                //   `Comparing new: ${JSON.stringify(
                //     newCal[item].calibration[cal]
                //   )} with ${JSON.stringify(this.eChook[item].calibration[cal])}`
                // );
                if (Object.hasOwn(newCal[item].calibration, cal)) {
                  // console.log(
                  //   `Updating ${cal} with ${newCal[item].calibration[cal].value}`
                  // );
                  this.eChook[item].calibration[cal].value =
                    newCal[item].calibration[cal].value;
                }
              }
            }
          }
          // console.log(`Item: ${item}`);
        }
        document.getElementById("fileButton").value = null;
        this.checkChange();
      });

      if (file) {
        reader.readAsText(file);
      }
    },
    getDmyString(timestamp) {
      let date = new Date();
      date.setTime(timestamp);
      let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
      let month =
        date.getMonth() + 1 < 10
          ? "0" + (Number(date.getMonth()) + 1)
          : date.getMonth() + 1;
      return `${day}-${month}-${date.getFullYear()}`;
    },
  },
};
</script>

<style lang="scss">
.background {
  padding: 20px;
  margin: 0;
  position: fixed;
  top: 70px;
  left: 0px;
  width: 100vw;
  height: Calc(100vh - 70px);
  overflow-y: scroll;
  background: var(--bg-gradient);
  border-top: 1px solid var(--glass-border);
}

.overlay {
  text-align: center;
  margin: 100px auto;
  width: 500px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 60px 80px 40px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.info-large {
  font-family: 'Raleway', sans-serif;
  font-size: 28px;
  color: var(--ghost-white);
  line-height: 1.4;
  margin-bottom: 30px;
}

.connect-button {
  width: 100%;
  height: 80px;
  background: var(--rosewood);
  color: var(--ghost-white);
  font-size: 28px;
  font-family: 'Oswald', sans-serif;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  box-shadow: none;
}

.connect-button:hover {
  cursor: pointer;
  background: #c53567;
  transform: translateY(-2px);
  box-shadow: none;
}

.connect-button:active {
  transform: translateY(1px);
}

.values-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-bottom: 120px;
}

.top-controls {
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(520px, 1.25fr);
  gap: 15px;
  width: 90%;
  max-width: 1280px;
  margin: 0 auto;
}

.cards-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(520px, 1.25fr);
  gap: 15px;
  width: 90%;
  max-width: 1280px;
  margin: 0 auto;
  align-items: start;
}

.cards-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 0;
}

.left-column {
  gap: 8px;
}

.value-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 20px 30px;
  box-sizing: border-box;
  background: var(--panel-bg);
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.value-container:hover {
  border: 1px solid var(--pacific-blue);
  background: var(--panel-bg-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
}

.value-title {
  font-size: 1.2em;
  font-family: 'Oswald', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--pacific-blue);
  padding-bottom: 10px;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--glass-border);
  flex: 0 0 100%;
}

.live-value {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 20px;
  min-width: 140px;
  margin: 10px;
  font-size: 26px;
  font-family: 'Oswald', sans-serif;
  background: rgba(32, 41, 56, 0.85);
  border-radius: 6px;
  color: var(--ghost-white);
  border: 1px solid var(--panel-border);
}

.compact-card {
  padding: 8px 10px;
}

.compact-card .value-title {
  font-size: 0.95em;
  margin-bottom: 6px;
}

.compact-card .live-value {
  width: 120px;
  min-width: 120px;
  min-height: 120px;
  margin: 0;
  font-size: 21px;
  padding: 8px;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  line-height: 1.1;
}

.calibratable-card {
  padding: 16px 20px;
}

.calibratable-layout {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.live-value-square {
  width: 130px;
  min-width: 130px;
  min-height: 130px;
  margin: 0;
  padding: 12px;
  flex-direction: column;
  text-align: center;
  gap: 6px;
  box-sizing: border-box;
}

.reading-value {
  font-size: 30px;
  line-height: 1;
}

.reading-unit {
  font-size: 18px;
  opacity: 0.9;
}

.calibration-stack {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calibration-stack .live-calibration {
  width: 100%;
  margin: 0;
}

.binary-cal-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  border-bottom: 1px solid var(--glass-border);

  .title {
    flex: 1;
  }
}

.binary-option {
  margin: 0 8px;
  width: 120px;
  text-align: center;
  background: rgba(238, 241, 246, 0.1);
  padding: 8px 15px;
  border-radius: 5px;
  font-weight: bold;
  color: var(--ghost-white);
  transition: all 0.2s ease;
  font-size: 14px;
}

.binary-option:hover {
  cursor: pointer;
  background: rgba(238, 241, 246, 0.2);
}

.binary-cal-container .active {
  background: var(--pacific-blue);
  color: var(--ghost-white);
  box-shadow: none;
}

.live-calibration {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px;
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 5px;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.changed {
  background: rgba(246, 174, 45, 0.1);
  border: 1px solid var(--honey-bronze);
  box-shadow: none;
}

.cal-input {
  height: 32px;
  background: var(--app-bg);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  color: var(--ghost-white);
  text-align: center;
  width: 100px;
  font-family: 'Oswald', sans-serif;
  font-size: 16px;
}

.cal-input:focus {
  outline: none;
  border-color: var(--pacific-blue);
  box-shadow: none;
}

.bottom-menu {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: rgba(17, 21, 29, 0.95);
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  z-index: 100;
}

.bottom-menu .button {
  margin: 0 12px;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  font-family: 'Oswald', sans-serif;
}

.bottom-menu .disconnect {
  background: var(--dark-slate-grey);
  color: var(--ghost-white);
}

.bottom-menu .disconnect:hover {
  background: #5a6478;
}

.bottom-menu .send-data {
  background: var(--rosewood);
  color: var(--ghost-white);
  box-shadow: none;
}

.bottom-menu .send-data:hover {
  background: #c53567;
  transform: translateY(-2px);
}

.button:hover {
  cursor: pointer;
  user-select: none;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.tools-background {
  z-index: 3;
  top: 0px;
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: rgba(17, 21, 29, 0.85);
  padding: 20vh 20vw;
}

.tools-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  width: 60vw;
  height: 60vh;
  padding: 30px;
}

.demo-trigger {
  margin-top: 20px;
  color: var(--ghost-white);
  opacity: 0.3;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.3s;
}

.demo-trigger:hover {
  opacity: 0.8;
}

@media (max-width: 1100px) {
  .top-controls {
    grid-template-columns: 1fr;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .calibratable-layout {
    flex-direction: column;
  }

  .live-value-square {
    width: 100%;
    min-width: 0;
    min-height: 88px;
  }
}
</style>
