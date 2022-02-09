<template>
  <div class="background">
    <div v-if="!connected">
      <p><button @click="connect">Connect</button></p>
    </div>
    <button v-if="connected" @click="serialRequestFloatCal">
      Fetch Current Calibration
    </button>
    <button v-if="connected" @click="serialToggleData">Toggle Data</button>
    <button v-if="connected" @click="inputBuffer = new Uint8Array(0)">
      Clear Data
    </button>
    <h2>
      {{
        connected
          ? waitingForData
            ? "Waiting for Data..."
            : "Connected"
          : "Disconnected"
      }}
    </h2>
    <div v-if="connected">
      <div class="values-container">
        <div class="value-container">
          <div class="value-title">Reference Voltage:</div>
          <div class="live-value">{{ eChook.referenceVoltage.value }}</div>
          <div class="live-calibration">
            {{ eChook.referenceVoltage.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Total Voltage:</div>
          <div class="live-value">{{ eChook.voltage.value }}</div>
          <div class="live-calibration">
            {{ eChook.voltage.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Lower Voltage:</div>
          <div class="live-value">{{ eChook.voltageLower.value }}</div>
          <div class="live-calibration">
            {{ eChook.voltageLower.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Current:</div>
          <div class="live-value">{{ eChook.current.value }}</div>
          <div class="live-calibration">
            {{ eChook.current.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Motor RPM:</div>
          <div class="live-value">{{ eChook.rpm.value }}</div>
          <div class="live-calibration">
            {{ eChook.rpm.calibration.magnets.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Speed:</div>
          <div class="live-value">{{ eChook.speed.value }}</div>
          <div class="live-calibration">
            {{ eChook.speed.calibration.magnets.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.speed.calibration.circumference.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Throttle Input:</div>
          <div class="live-value">{{ eChook.throttleInput.value }}</div>
          <div class="live-calibration">
            {{ eChook.throttleInput.calibration.lowThreshold.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.throttleInput.calibration.highThreshold.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Throttle Output:</div>
          <div class="live-value">{{ eChook.throttleActual.value }}</div>
          <div class="live-calibration">
            {{ eChook.throttleActual.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Thermistor 1:</div>
          <div class="live-value">{{ eChook.temp1.value }}</div>
          <div class="live-calibration">
            {{ eChook.temp1.calibration.A.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.temp1.calibration.B.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.temp1.calibration.C.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Thermistor 2:</div>
          <div class="live-value">{{ eChook.temp2.value }}</div>
          <div class="live-calibration">
            {{ eChook.temp2.calibration.A.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.temp2.calibration.B.value }}
          </div>
          <div class="live-calibration">
            {{ eChook.temp2.calibration.C.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Temperature PCB:</div>
          <div class="live-value">{{ eChook.temp3.value }}</div>
          <div class="live-calibration">
            {{ eChook.temp3.calibration.value }}
          </div>
        </div>
        <div class="value-container">
          <div class="value-title">Launch Mode Button:</div>
          <div class="live-value">{{ eChook.launchMode.value }}</div>
          <div class="live-calibration">noCal</div>
        </div>
        <div class="value-container">
          <div class="value-title">Cycle View Button:</div>
          <div class="live-value">{{ eChook.cycleView.value }}</div>
          <div class="live-calibration">noCal</div>
        </div>
        <div class="value-container">
          <div class="value-title">Gear Ratio:</div>
          <div class="live-value">{{ eChook.gearRatio.value }}</div>
          <div class="live-calibration">noCal</div>
        </div>
        <div class="value-container">
          <div class="value-title">Brake Switch:</div>
          <div class="live-value">{{ eChook.brakePressed.value }}</div>
          <div class="live-calibration">
            {{ eChook.brakePressed.calibration.value }}
          </div>
        </div>
      </div>
      <div class="serial-view">{{ inputBuffer }}</div>
    </div>
  </div>
</template>

<script>
/* eslint @typescript-eslint/no-var-requires: "off" */
// var util = require("util");
import util from "util";

export default {
  data() {
    return {
      dataIn: "Starting String",
      //   port: navigator.serial.port,
      //   decoder: new util.TextDecoderStream(),
      //   inputDone: navigator.port.readable,
      //   inputStream: util.TextDecoder.decoder.readable,
      //   reader: 0,
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
      serialCalibration: {
        dataPacketLength: 5,
        binaryCalArrayLength: 7,
        binaryCalIdentifier: "b",
        floatCalArrayLength: 83,
        floatCalIdentifier: "f",
        btNameArrayLength: 13,
        btNameIdentifier: "n",
      },
      eChook: {
        other: {
          identifier: null,
          transmitInterval: null,
          useHardcoded: null,
          product: null,
          swVersion: null,
        },
        speed: {
          value: null,
          identifier: "s",
          calibration: {
            magnets: {
              value: null,
              floatIndex: 1,
              changed: 0,
              old: null,
            },
            circumference: {
              value: null,
              floatIndex: 15,
              changed: 0,
              old: null,
            },
          },
        },
        rpm: {
          value: null,
          identifier: "m",
          calibration: {
            magnets: {
              value: null,
              floatIndex: 2,
              changed: 0,
              old: null,
            },
          },
        },
        current: {
          value: null,
          identifier: "i",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: 6,
          },
        },
        voltage: {
          value: null,
          identifier: "v",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: 4,
          },
        },
        voltageLower: {
          value: null,
          identifier: "w",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: 5,
          },
        },
        throttleInput: {
          value: null,
          identifier: "t",
          calibration: {
            lowThreshold: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 13,
            },
            highThreshold: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 14,
            },
          },
        },
        throttleActual: {
          value: null,
          identifier: "d",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
        temp1: {
          value: null,
          identifier: "a",
          calibration: {
            A: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 7,
            },
            B: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 8,
            },
            C: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 9,
            },
          },
        },
        temp2: {
          value: null,
          identifier: "b",
          calibration: {
            A: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 10,
            },
            B: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 11,
            },
            C: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: 12,
            },
          },
        },
        temp3: {
          value: null,
          identifier: "c",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null, // no calibration
          },
        },
        launchMode: {
          value: null,
          identifier: "L",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
        cycleView: {
          value: null,
          identifier: "C",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
        gearRatio: {
          value: null,
          identifier: "r",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
        brakePressed: {
          value: null,
          identifier: "B",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
        referenceVoltage: {
          value: null,
          identifier: "V",
          calibration: {
            value: null,
            changed: 0,
            old: null,
            floatIndex: null,
          },
        },
      },
    };
  },
  created() {
    if ("serial" in navigator) {
      this.hasSerial = true;
    }
  },
  methods: {
    async connect() {
      this.connected = false;
      this.port = await navigator.serial.requestPort();
      // - Wait for the port to open.
      try {
        await this.port.open({ baudRate: 115200 });
      } catch (error) {
        console.log("*** open port error ***");
        console.log(error);
        this.connectFailed = true;
      }
      // Check for success and continue
      if (!this.connectFailed) {
        this.inputBuffer = new Uint8Array(0);
        this.connected = true;
        console.log("Open");
        this.reader = this.port.readable.getReader();
        // this.writer = this.port.writable.getWriter();
        this.closed = this.readLoop();
      }
    },
    async readLoop() {
      console.log(`Entering ReadLoop`);

      while (this.running) {
        const { value, done } = await this.reader.read();
        // The value is returned as Uint8 Arrays of random size. First requirement is to concat previous buffer with new incoming data
        // to form a new input buffer array:
        // console.log(value);
        this.inputBuffer = this.concatenate(this.inputBuffer, value);
        // Now work backwards through the buffer to identify any eChook protocol data packets:
        let found = 1;
        while (found) {
          found = 0;
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
                  if (
                    String.fromCharCode(
                      this.inputBuffer[
                        i - this.serialCalibration.floatCalArrayLength + 1
                      ]
                    ) === "["
                  ) {
                    console.log("Float Calibration Packet Found");
                    // Packet Found, verify with ID character:
                    if (
                      String.fromCharCode(
                        this.inputBuffer[
                          i - this.serialCalibration.floatCalArrayLength + 2
                        ]
                      ) === "f"
                    ) {
                      let calArray = new Uint8Array();
                      calArray = this.inputBuffer.slice();
                      //   this.eChookDataDecode(id, byte1, byte2);
                      found = 1;
                      this.inputBuffer = this.concatenate(
                        this.inputBuffer.slice(0, i - 4),
                        this.inputBuffer.slice(i + 1, this.inputBuffer.length)
                      ); // Remove the interpreted packet from the buffer
                      i = -1; // Exit the for loop and search again from the top.
                    }
                  }
                }
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
      this.waitingForData = 0;
      let value = 0;
      id = String.fromCharCode(id);
      //Decode Numbers:
      if (byte1 === 255 && byte2 === 255) {
        value = 0;
      } else if (byte1 > 128) {
        //Integer Value
        let hundreds = 0;
        if (byte1 === 255) {
          hundreds = 0;
        } else {
          hundreds = (byte1 - 128) * 100;
        }
        let tens = 0;
        if (byte2 === 255) {
          tens = 0;
        } else {
          tens = byte2;
        }
        value = hundreds + tens;
      } else {
        //Float Value
        let intVal = 0;
        if (byte1 === 255) {
          intVal = 0;
        } else {
          intVal = byte1;
        }
        let decimal = 0;
        if (byte2 === 255) {
          decimal = 0;
        } else {
          decimal = byte2 / 100;
        }
        value = Number(intVal + decimal);
      }

      //   now update relevant value
      //   console.log(`eChook Data Decode, ID:${id}, Value:${value}`);
      for (let i in this.eChook) {
        if (this.eChook[i].identifier === id) {
          this.eChook[i].value = value.toFixed(2);
        }
      }
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
    serialRequestHWVersion() {
      let data = new Uint8Array(2);
      let text = "gh"; // Request Hardware version
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestSWVersion() {
      let data = new Uint8Array(2);
      let text = "gs"; // Request Software version
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestBinaryCal() {
      let data = new Uint8Array(2);
      let text = "gb"; // Request  Binary cal data
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialRequestFloatCal() {
      let data = new Uint8Array(2);
      let text = "gf"; // Request Float cal data
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialToggleData() {
      let data = new Uint8Array(2);
      let text = "gd"; // Request Float cal data
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
  },
};
</script>

<style lang="scss">
.background {
  position: fixed;
  top: 70px;
  left: 0px;
  width: 100vw;
  height: Calc(100vh - 70px);
  background-color: #a0a0a0d0;
  overflow-y: scroll;
}
.serial-view {
  background-color: #f9f9f9;
  height: 30vh;
  width: 80vw;
  margin: 30px auto;
  padding: 20px;
  word-wrap: break-word;
  overflow: scroll;
}
.values-container {
  display: flex;
  flex-direction: column;
}

.value-container {
  display: flex;
  flex-direction: row;
  width: 70vw;
  margin: 5px auto;
  padding: 10px 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  border: solid 2px #f9f9f9;
}

.value-container:hover {
  border: solid 2px #e71b64;
}

.value-title {
  font-size: 1.1em;
  padding-right: 15px;
  vertical-align: middle;
}

.live-value {
  vertical-align: middle;
}
</style>
