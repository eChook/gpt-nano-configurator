<template>
  <div class="background">
    <div class="disconnected overlay" v-if="!connected">
      <div class="info-large">
        <strong>
          Plug in your eChook GPT
          <p>Or</p>
          Connect via Bluetooth
          <p>Then:</p>
        </strong>
      </div>
      <p><button class="connect-button" @click="connect">Connect</button></p>
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
    <div v-if="connected && !waitingForData">
      <div class="values-container">
        <!-- <div class="serial-view">{{ inputBuffer }}</div> -->
        <div class="value-container">
          <div class="value-title">Device Information</div>
          <div class="live-calibration">
            <div class="title">Name</div>
          <input class="cal-input" type="text" v-model="eChook.bluetoothName.value" />
        </div></div>

        <div class="value-container binary">
          <div class="value-title">Setting Toggles</div>
          <template v-for="item in eChook.binary" v-bind:key="item">
            <div v-if="!item.hidden" class="binary-cal-container">
              <div class="title">{{ item.name }}</div>
              <div
                class="binary-option"
                @click="item.value = 1"
                v-bind:class="{ active: item.value }"
              >
                {{ item.op1 }}
              </div>
              <div
                class="binary-option"
                @click="item.value = 0"
                v-bind:class="{ active: !item.value }"
              >
                {{ item.op2 }}
              </div>
            </div>
          </template>
        </div>

       
        <template v-for="item in eChook" v-bind:key="item">
          <div v-if="item.title && !item.hidden" class="value-container">
            <div class="value-title">{{ item.title }}</div>
            <div v-if="item.value != null" class="live-value">
              <!-- <div class="title">Live Data:</div> -->
              {{ item.value }} {{ item.units }}
            </div>
            <!-- <div v-if="item.calibration"> -->
            <template v-for="cal in item.calibration" v-bind:key="cal">
              <div
                v-if="cal.value != null"
                class="live-calibration"
                v-bind:class="{ changed: cal.changed }"
              >
                <div class="title">{{ cal.name }}:</div>
                <input
                  class="cal-input"
                  @input="checkChange"
                  type="number"
                  v-model="cal.value"
                />
                <div>{{ cal.unit }}</div>
                <!-- {{ cal.value }}  -->
              </div>
            </template>
            <!-- </div> -->
          </div>
        </template>
      </div>
      <div style="height: 100px"></div>
      <div class="bottom-menu">
        <div @click="disconnectPort" class="button disconnect">Disconnect</div>
        <div class="button">Backup Config</div>
        <div class="button">Restore Backup</div>
        <div class="button send-data" @click="serialSendAllCal">
          {{ sendCalText }}
        </div>
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
      changeCount: 0,
      serialCalibration: {
        dataPacketLength: 5,
        binaryCalArrayLength: 10,
        binaryCalIdentifier: "b",
        floatCalArrayLength: 83,
        floatCalIdentifier: "f",
        btNameArrayLength: 33,
        btNameIdentifier: "n",
      },
      eChook: {
        binary: {
          variableThrottle: {
            name: "Throttle Type",
            op1: "Variable",
            op2: "On/Off",
            value: null,
            old: null,
            hidden: 0,
            changed: 0,
          },
          throttleOut: {
            name: "Throttle Output (PWM)",
            op1: "On",
            op2: "Off",
            value: null,
            old: null,
            hidden: 0,
            changed: 0,
          },
          throttleRamp: {
            name: "Throttle Ramp",
            op1: "On",
            op2: "Off",
            value: null,
            old: null,
            hidden: 0,
            changed: 0,
          },
          linearTempSensor: {
            name: "Temp Sensor Type",
            op1: "Linear",
            op2: "Thermistor",
            value: null,
            old: null,
            hidden: 0,
            changed: 0,
          },
        },
        bluetoothName: {
          value: null,
          old: null,
          hidden: 1,
          changed: 0,
        },
        transmitInterval: {
          title: "Data Transmit Interval",
          precision: 0,
          units: "ms",
          identifier: null,
          hidden: 1,
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
          precision: 0,
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
          title: "Volatge (lower)",
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
              unit: "Volts",
              value: null,
              precision: 2,
              changed: 0,
              old: null,
              floatIndex: 13,
            },
            highThreshold: {
              name: "High Threshold",
              unit: "Volts",
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

        launchMode: {
          title: "Launch Mode Button",
          precision: 0,
          units: null,
          value: 0,
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
          value: 0,
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
          value: 0,
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
      },
    };
  },
  created() {
    if ("serial" in navigator) {
      this.hasSerial = true;
    }
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
  },
  methods: {
    checkChange() {
      console.log(`CheckChange`);
      this.changeCount = 0;

      //Checks for changes from fetched calibration

      // Binary Values:
      for (let item in this.eChook.binary) {
        let tmp = this.eChook.binary[item];
        if (tmp.value != tmp.old) {
          tmp.changed = 1;
          this.changeCount++;
        }
      }

      // Float Values
      for (let item in this.eChook) {
        let tempChook = this.eChook[item];
        if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
          for (let cal in tempChook.calibration) {
            let c = tempChook.calibration[cal];
            if (c.value != c.old) {
              c.changed = 1;
              this.changeCount++;
            }else{
              c.changed = 0;
            }
          }
        }
      }
    },
    async connect() {
      this.connected = false;
      this.port = await navigator.serial.requestPort();
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
        this.reader = this.port.readable.getReader();
        // this.writer = this.port.writable.getWriter();
        this.closed = this.readLoop();
      }
    },
    async disconnectPort() {
      window.location.reload();
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
        this.waitingForData = 0;
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

      this.eChook.binary.variableThrottle.value = CAL_A & 0x40;
      this.eChook.binary.variableThrottle.old = CAL_A & 0x40;

      this.eChook.binary.linearTempSensor.value = CAL_A & 0x20;
      this.eChook.binary.linearTempSensor.old = CAL_A & 0x20;

      this.eChook.binary.throttleOut.value = CAL_A & 0x10;
      this.eChook.binary.throttleOut.old = CAL_A & 0x10;

      this.eChook.binary.throttleRamp.value = CAL_A & 0x08;
      this.eChook.binary.throttleRamp.old = CAL_A & 0x08;

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
    serialRequestAllCal() {
      this.serialRequestFloatCal();
      this.serialRequestBinaryCal();
      this.serialRequestBTName();
    },
    serialRequestBTName() {
      let data = new Uint8Array(2);
      let text = "gn"; // Request Hardware version
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
      let text = "gd";
      data[0] = text.charCodeAt(0);
      data[1] = text.charCodeAt(1);
      this.serialWrite(data);
    },
    serialSendAllCal() {
      this.serialSendBtName();
      this.serialSendFloatData();
    },
    serialSendBtName() {
      if (
        this.eChook.bluetoothName.value != null &&
        this.eChook.bluetoothName.value.length <= 30
      ) {
        let data = new Uint8Array(32);
        data.fill(0xff);
        let text = "sn"; //Set Name
        data[0] = text.charCodeAt(0);
        data[1] = text.charCodeAt(1);
        for (
          let i = 0;
          i < this.eChook.bluetoothName.value.length;
          i++
        ) {
          data[i + 2] = this.eChook.bluetoothName.value.charCodeAt(i);
          console.log(
            `Adding ${this.eChook.bluetoothName.value.charCodeAt(
              i
            )} to data at ${i + 2}`
          );
        }
        console.log(`Sending: ${data}`);
        this.serialWrite(data);
      }
    },
    serialSendFloatData() {
      let floatData = new Float32Array(20);
      let view = new DataView(floatData.buffer);

      for (let item in this.eChook) {
        let tempChook = this.eChook[item];
        if ({}.hasOwnProperty.call(this.eChook[item], "calibration")) {
          for (let cal in tempChook.calibration) {
            let c = tempChook.calibration[cal];
            if (c.floatIndex != null) {
              console.log(``);
              view.setFloat32(c.floatIndex * 4, c.value, true); // Converts to litte endian:
              // https://stackoverflow.com/questions/26025215/about-the-binary-format-of-javascript-typedarray-float32
            }
          }
        }
      }

      let command = new Uint8Array(2);
      let text = "sf"; //Set Name
      command[0] = text.charCodeAt(0);
      command[1] = text.charCodeAt(1);

      let data = new Uint8Array(view.buffer);
      this.serialWrite(command);
      this.serialWrite(data);
      // console.log(`OutBuffer: ${data}`);
    },
    serialSendBinaryData() {
      let data = new Uint8Array(4 + 2);
      data.fill(0);

      if (this.eChook.binary.useHardcoded.value) {
        data[2] = data[2] | 0x80;
      }

      if (this.eChook.binary.variableThrottle.value) {
        data[2] = data[2] | 0x40;
      }

      if (this.eChook.binary.linearTempSensor.value) {
        data[2] = data[2] | 0x20;
      }

      if (this.eChook.binary.throttleOut.value) {
        data[2] = data[2] | 0x10;
      }

      if (this.eChook.binary.throttleRamp.value) {
        data[2] = data[2] | 0x08;
      }

      let command = "sb";
      data[0] = command.charCodeAt(0);
      data[1] = command.charCodeAt(1);

      this.serialWrite(data);
    },
  },
};
</script>

<style lang="scss">
div {
  // border-radius: 5%;
  // border: solid lightblue 1px;
  font-family: Cabin, sans-serif;
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

.overlay {
  // position: fixed;

  text-align: center;
  margin: 150px auto;
  // left: 10vw;
  // height: 20vh;
  width: 500px;
  background-image: linear-gradient(135deg, #f9f9f9 10%, #e2e2e2 100%);
  border: solid 2px #1c2331;
  border-radius: 10px;
  padding: 80px 100px 50px;
}

.info-large {
  font-family: Cabin 400 sans-serif;
  font-size: 30px;
}

.connect-button {
  width: 400px;
  height: 90px;
  background-image: linear-gradient(0deg, #ff758c 10%, #e91e63 100%);
  color: #f9f9f9;
  font-size: 40px;
  border: solid 3px #e91e63;
  border-radius: 15px;
  font-weight: bold;
}

.connect-button:hover {
  cursor: pointer;
  box-shadow: 0 0 3px 0px black;
}

.connect-button:active {
  background-image: linear-gradient(0deg, #e91e63 10%, #ff758c 100%);
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

.values-container .binary {
  // flex-direction: row;
  display: block;
}

.binary-cal-container {
  display: flex;
  flex-direction: row;
  vertical-align: middle;
  text-align: left;
  // border-top: solid darken($color: #f9f9f9, $amount: 10%);
  border-bottom: solid darken($color: #f9f9f9, $amount: 20%);
  // margin: 10px 0;
}

.binary-option {
  margin: 10px 10px;
  width: 130px;
  text-align: center;
  background-color: darken($color: #f9f9f9, $amount: 10%);
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
}

.binary-cal-container .active {
  background-image: linear-gradient(135deg, #70f570 10%, #49c628 100%);
}

.binary-cal-container .title {
  width: 250px;
  margin: auto 0;
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
  font-family: Oswald;
  font-weight: bold;
  //   font-family: Raleway, normal;
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
  margin: 1px 3px;
  padding: 3px 8px;
  vertical-align: middle;
}

.changed {
  background-color: #e91e63;
  border-radius: 3px;
  color: #f9f9f9;
}
.cal-input {
  height: 2em;
  border: darken(#f9f9f9, 10%) solid 1px;
  border-radius: 2px;
  text-align: center;
  min-width: 100px;
}

.bottom-menu {
  position: fixed;
  left: 0px;
  bottom: 0%;
  // height: 55px;
  width: 100%;
  // background-image: linear-gradient(135deg, #fdfbfb 10%, #ebedee 100%);
  background-image: linear-gradient(0deg, #1c2331 10%, #292e49 100%);
  border-top: solid 3px #1c2331;
  color: #f9f9f9;
  display: inline-flex;
  justify-content: center;
}

.bottom-menu .button {
  margin: 8px 20px;
  padding: 9px 15px;
  background-color: #e91e63;
  // background-image: linear-gradient(135deg, #e91e63 10%, #b91d73 100%);
  border-radius: 8px;
  font-weight: bold;
  font-size: 18px;
}

.bottom-menu .disconnect {
  margin-right: auto;
  background-color: red;
}

.bottom-menu .send-data {
  background-color: green;
}

.button:hover {
  cursor: pointer;
  user-select: none;
}

// Remove arrows from input boxes
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
