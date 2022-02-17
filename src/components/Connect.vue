<template>
  <div class="background">
    <div class="disconnected overlay" v-if="!connected">
        <div class="info-large">Plug in your eChook GPT or connect via Bluetooth, then:</div>
      <p><button @click="connect">Connect</button></p>
    </div>
    <!-- <button v-if="connected" @click="serialRequestFloatCal">
      Fetch Current Calibration
    </button> -->
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
    <div v-if="connected">
      <div class="values-container">
        <template v-for="item in eChook" v-bind:key="item">
          <div v-if="item.title" class="value-container">
            <div class="value-title">{{ item.title }}:</div>
            <div v-if="item.value != null" class="live-value">
              <!-- <div class="title">Live Data:</div> -->
              {{ item.value }} {{ item.units }}
            </div>
            <!-- <div v-if="item.calibration"> -->
            <template v-for="cal in item.calibration" v-bind:key="cal">
              <div v-if="cal.value != null" class="live-calibration">
                <div class="title">{{ cal.name }}:</div>
                <input class="cal-input" type="number" v-model="cal.value" />
                <div>{{ cal.unit }}</div>
                <!-- {{ cal.value }}  -->
              </div>
            </template>
            <!-- </div> -->
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
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
          transmitIntervalOld: null,
          useHardcoded: null,
          product: null,
          swVersion: null,
        },
        transmitInterval: {
          title: "Data Transmit Interval",
          precision: 0,
          units: "ms",
          identifier: null,
          calibration: {
            interval: {
              name: "Interval",
              units: "ms",
              value: null,
              floatIndex: 0,
              changed: 0,
              old: null,
            },
          },
        },
        speed: {
          title: "Speed",
          precision: 2,
          units: "m/s",
          value: null,
          identifier: "s",
          calibration: {
            magnets: {
              name: "Magnets",
              precision: 0,
              value: null,
              floatIndex: 1,
              changed: 0,
              old: null,
            },
            circumference: {
              name: "Circumference",
              unit: "meters",
              precision: 2,
              value: null,
              floatIndex: 15,
              changed: 0,
              old: null,
            },
          },
        },
        rpm: {
          title: "Motor RPM",
          precision: 2,
          units: "RPM",
          value: null,
          identifier: "m",
          calibration: {
            magnets: {
              name: "Magnets",
              value: null,
              floatIndex: 2,
              changed: 0,
              old: null,
            },
          },
        },
        current: {
          title: "Current",
          precision: 2,
          units: "A",
          value: null,
          identifier: "i",
          calibration: {
            multiplier: {
              name: "Scaling Factor",
              precision: 2,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 6,
            },
          },
        },
        voltage: {
          title: "Voltage (total)",
          precision: 2,
          units: "V",
          value: null,
          identifier: "v",
          calibration: {
            multiplier: {
              name: "Scaling Factor",
              precision: 2,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 4,
            },
          },
        },
        voltageLower: {
          title: "Voltge (lower)",
          precision: 2,
          units: "V",
          value: null,
          identifier: "w",
          calibration: {
            multiplier: {
              name: "Scaling Factor",
              precision: 2,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 5,
            },
          },
        },
        throttleInput: {
          title: "Throttle Input",
          precision: 2,
          units: "V",
          value: null,
          identifier: "t",
          calibration: {
            lowThreshold: {
              name: "Low Threshold",
              units: "Volts",
              value: null,
              precision: 2,
              changed: 0,
              old: null,
              floatIndex: 13,
            },
            highThreshold: {
              name: "High Threshold",
              units: "Volts",
              value: null,
              precision: 2,
              changed: 0,
              old: null,
              floatIndex: 14,
            },
          },
        },
        throttleActual: {
          title: "Throttle Output",
          precision: 1,
          units: "%",
          value: null,
          identifier: "d",
          calibration: {
            multiplier: {
              value: null, // Not used, but present to keep the object iterable in the template
              precision: 1,
              changed: 0,
              old: null,
              floatIndex: null,
            },
          },
        },
        temp1: {
          title: "Temperature 1",
          precision: 0,
          units: "°c",
          value: null,
          identifier: "a",
          calibration: {
            A: {
              name: "Cal A",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 7,
            },
            B: {
              name: "Cal B",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 8,
            },
            C: {
              name: "Cal C",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 9,
            },
          },
        },
        temp2: {
          title: "Temperature 2",
          precision: 0,
          units: "°c",
          value: null,
          identifier: "b",
          calibration: {
            A: {
              name: "Cal A",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 10,
            },
            B: {
              name: "Cal B",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 11,
            },
            C: {
              name: "Cal C",
              precision: 7,
              value: null,
              changed: 0,
              old: null,
              floatIndex: 12,
            },
          },
        },
        temp3: {
          title: "Temperature eChook",
          precision: 0,
          units: "°c",
          value: null,
          identifier: "c",
          calibration: {
            placeholder: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
          },
        },
        launchMode: {
          title: "Launch Mode Button",
          precision: 0,
          units: null,
          value: null,
          identifier: "L",
          calibration: {
            placeholder: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
          },
        },
        cycleView: {
          title: "Next Screen Button",
          precision: 0,
          units: null,
          value: null,
          identifier: "C",
          calibration: {
            placeholder: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
          },
        },
        gearRatio: {
          title: "Gear Ratio",
          precision: 2,
          units: null,
          value: null,
          identifier: "r",
          calibration: {
            placeholder: {
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
          },
        },
        brakePressed: {
          title: "Brake Switch",
          precision: 0,
          units: null,
          value: null,
          identifier: "B",
          calibration: {
            inverted: {
              name: "Inverted",
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
          },
        },
        referenceVoltage: {
          title: "Reference Voltage",
          precision: 2,
          units: "V",
          value: null,
          identifier: "V",
          calibration: {
            voltage: {
              name: "Voltage",
              units: "Volts",
              value: null,
              changed: 0,
              old: null,
              floatIndex: null, // no calibration
            },
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
                      // Pull the float data out into an array:
                      let calArray = new Uint8Array();
                      calArray = this.inputBuffer.slice(
                        i - this.serialCalibration.floatCalArrayLength + 3,
                        i
                      );
                      console.log(`Float Array Length: ${calArray.length}`);
                      console.log(`Float Array Identified as: ${calArray}`);
                      this.eChookFloatCalDecode(calArray);
                      found = 1;

                      // Remove the interpreted packet from the buffer
                      this.inputBuffer = this.concatenate(
                        this.inputBuffer.slice(0, i - 4),
                        this.inputBuffer.slice(i + 1, this.inputBuffer.length)
                      );
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
      if (this.waitingForData) {
        this.waitingForData = 0;
        this.serialRequestFloatCal();
      }
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
    eChookFloatCalDecode(calArray) {
      let view = new DataView(calArray.buffer);

      for (
        let i = 0;
        i < this.serialCalibration.floatCalArrayLength - 5;
        i = i + 4
      ) {
        //   let floatBuff = calArray.slice(i, i+4);
        //   let view = new DataView(floatBuff.buffer);
        let output = view.getFloat32(i, 1);
        console.log(`Float ${i / 4} read as ${output}`);

        //   Now a long winded asign calibration routine.
        let index = i / 4;

        // new assignment routine
        for (let item in this.eChook) {
          console.log(`Looking in ${this.eChook[item].title}`);
          let tempChook = this.eChook[item];
          if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
            for (let cal in tempChook.calibration) {
              let c = tempChook.calibration[cal];
              console.log(`Stringified: ${JSON.stringify(c)}`);
              console.log(`Checking index ${tempChook.title}, ${c.name}`);
              if (c.floatIndex === index) {
                c.value = output.toFixed(c.precision);
                c.old = c.value;
              }
            }
          }
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
div {
  // border-radius: 5%;
  // border: solid lightblue 1px;
}

.background {
  padding: 10px;
  margin: 0;
  position: fixed;
  top: 70px;
  left: 0px;
  width: 100vw;
  height: Calc(100vh - 70px);
  //   background-color: #3f729b;
  overflow-y: scroll;
  //Gradient
  background: #007aa5;
  background: linear-gradient(to bottom, #007aa5 0%, #006b96 100%);
  background: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #007aa5),
    color-stop(100%, #006b96)
  );
  background: -webkit-linear-gradient(top, #007aa5 0%, #006b96 100%);
  background: -moz-linear-gradient(top, #007aa5 0%, #006b96 100%);
  background: -o-linear-gradient(top, #007aa5 0%, #006b96 100%);
  background: -ms-linear-gradient(top, #007aa5 0%, #006b96 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#007AA5', endColorstr='#006B96', GradientType=0);
  border: 1px solid #005c87;
  box-shadow: inset 0 1px 0 #0f89b4;
  -webkit-box-shadow: inset 0 1px 0 #0f89b4;
  -moz-box-shadow: inset 0 1px 0 #0f89b4;
}

.overlay{
    // position: fixed;
    
    text-align: center;
    margin: 150px auto;
    // left: 10vw;
    height: 20vh;
    width: 80vw;
    background-image: linear-gradient(135deg, #f9f9f9 10%, #e2e2e2 100%);
    border: solid 2px #1c2331;
    border-radius: 10px;
    padding: 20px 0;

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
  flex-wrap: wrap;
  width: 70vw;
  max-width: 800px;
  min-width: 600px;
  margin: 5px auto;
  padding: 10px 20px;
  //   background-color: #e3f2fd;
  border-radius: 10px;
  border: solid 3px #1c2331;

  background-image: linear-gradient(135deg, #fdfbfb 10%, #ebedee 100%);
}

.value-container:hover {
  border: solid 3px #e91e63;
  box-shadow: 0 0 10px 1px #1c2331;
}

.live-value {
  vertical-align: middle;
  padding: 10px 0;
  width: 150px;
  margin: auto 10px auto 5px;
  //   height: 4em;
  font-size: 22px;
  font-family: "Raleway" 500;
//   font-weight: 500;
  border-right: solid #1c2331 2px;
  //   border: solid grey 2px;
  //   border-radius: 3px;
}

.value-title {
  font-size: 1.1em;
  font-weight: bold;
  //   padding-right: 15px;
  padding-bottom: 3px;
  margin-bottom: 2px;
  border-bottom: #1c2331 solid 3px;
  text-align: left;
  vertical-align: middle;
  flex: 0 0 100%;
}

.title {
  padding: 3px 8px;
  font-weight: bold;
  margin-bottom: 5px;
  font-family: Cabin 400;
}
.live-calibration {
  padding: 3px 8px;
  vertical-align: middle;
}
.cal-input {
  height: 2em;
  border: darken(#f9f9f9, 10%) solid 1px;
  text-align: center;
  width: 100px;
}

// Remove arrows from input boxes
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
