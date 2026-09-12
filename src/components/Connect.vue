<template>
  <ConnectScreen
    v-if="!connected || waitingForData"
    :connecting="connecting || (connected && waitingForData)"
    :has-serial="hasSerial"
    @connect="connect"
    @demo="mockConnect"
  />

  <div v-else class="app-shell">
    <AppHeader :name="eChook.bluetoothName.value" @disconnect="disconnectPort" />
    <div class="app-body">
      <DsNavRail :items="navItems" :active-id="tab" @select="(id) => (tab = id)" />
      <div class="app-main">
        <div class="app-scroll">
          <DeviceOverviewPage
            v-if="tab === 'overview'"
            :e-chook="eChook"
            :ordered-display-items="orderedDisplayItems"
            :change-count="changeCount"
            :magnets-locked="magnetsLocked"
            :device-type="deviceType"
            :sw-version-display="swVersionDisplay"
            :update-available="updateAvailable"
            :five-volt-live="fiveVoltLive"
            @changed="checkChange"
            @run-setup="openWizard('setup')"
            @open-wizard="openWizard"
            @open-voltage-wizard="openVoltageWizard"
            @open-fivevolt-wizard="openWizard('fiveVoltRail')"
          />
          <SettingsPage v-else-if="tab === 'settings'" :binary="eChook.binary" @changed="checkChange" />
          <BackupPage
            v-else-if="tab === 'backup'"
            @backup="backupDownload"
            @restore-file="handleRestoreFileSelected"
            @reset="resetModalOpen = true"
          />
        </div>
        <BottomBar :count="changeCount" @send="sendModalOpen = true" />
      </div>
    </div>

    <WizardModal
      v-if="activeWizard === 'setup'"
      title="Setup wizard"
      :steps="setupSteps"
      @close="closeWizard"
      @finish="finishSetupWizard"
    />
    <WizardModal
      v-if="activeWizard === 'speed'"
      title="Speed sensor calibration"
      :steps="speedWizardSteps"
      @close="closeWizard"
      @finish="finishSpeedWizard"
    />
    <WizardModal
      v-if="activeWizard === 'fiveVoltRail'"
      title="Calibrate 5V rail"
      :steps="fiveVoltWizardSteps"
      @close="closeWizard"
      @finish="finishFiveVoltWizard"
    />
    <WizardModal
      v-if="activeWizard === 'voltage-total' || activeWizard === 'voltage-lower'"
      :title="(activeWizard === 'voltage-total' ? 'Voltage (Total)' : 'Voltage (Lower)') + ' calibration'"
      :steps="voltageWizardSteps"
      @close="closeWizard"
      @finish="finishVoltageWizard"
    />

    <DsModal
      v-if="sendModalOpen"
      title="Send changes to eChook?"
      :description="`${changeCount} value${changeCount === 1 ? '' : 's'} will be written to the board's EEPROM.`"
      confirm-label="Send changes"
      @cancel="sendModalOpen = false"
      @confirm="confirmSend"
    >
      <template #extra>
        <div class="diff-list">
          <ReviewRow v-for="(d, i) in buildDiffs()" :key="i" :label="d.label" :value="`${d.from} → ${d.to}`" />
        </div>
      </template>
    </DsModal>

    <DsModal
      v-if="resetModalOpen"
      title="Reset eChook to defaults?"
      description="This clears the EEPROM and reverts every calibration value and setting. Once done, unplug then reconnect the eChook."
      danger
      confirm-label="Reset eChook"
      @cancel="resetModalOpen = false"
      @confirm="confirmReset"
    />

    <DsModal
      v-if="restoreModalOpen"
      title="Load backup?"
      description="Loading this file will overwrite the values currently loaded below. Nothing is written to the board until you send changes."
      confirm-label="Load backup"
      @cancel="restoreModalOpen = false"
      @confirm="confirmRestore"
    />

    <Toast :text="toast" />
  </div>
</template>

<script>
import * as ext from "../scripts/dataTemplate.js";
import { computed } from "vue";

import ConnectScreen from "./nano/ConnectScreen.vue";
import AppHeader from "./nano/Header.vue";
import DsNavRail from "./ds/NavRail.vue";
import DeviceOverviewPage from "./nano/DeviceOverviewPage.vue";
import SettingsPage from "./nano/SettingsPage.vue";
import BackupPage from "./nano/BackupPage.vue";
import BottomBar from "./nano/BottomBar.vue";
import WizardModal from "./nano/WizardModal.vue";
import DsModal from "./ds/Modal.vue";
import ReviewRow from "./nano/ReviewRow.vue";
import Toast from "./nano/Toast.vue";
import { Bolt, Gear, Archive } from "./icons/nanoIcons";
import { buildSetupSteps, buildSpeedWizardSteps, buildFiveVoltWizardSteps, buildVoltageWizardSteps } from "./nano/wizardSteps.js";

// Latest published firmware, as major.minor.patch. Bump on each firmware
// release, or read it from the release manifest once one is published.
const LATEST_FIRMWARE = { major: 2, minor: 4, patch: 3 };

// Firmware from which a single wheel magnet is required.
const MAGNETS_LOCKED_FROM = { major: 2, minor: 1, patch: 0 };

// Comparator over {major, minor, patch}: negative if a is older than b.
function compareVersion(a, b) {
  return (a.major - b.major) || (a.minor - b.minor) || (a.patch - b.patch);
}

export default {
  components: {
    ConnectScreen,
    AppHeader,
    DsNavRail,
    DeviceOverviewPage,
    SettingsPage,
    BackupPage,
    BottomBar,
    WizardModal,
    DsModal,
    ReviewRow,
    Toast,
  },
  data() {
    return {
      tools: 0,
      dataIn: "Starting String",
      hasSerial: 0,
      connected: false,
      connecting: false,
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
      firmwareVersion: null,
      ackResolver: null,
      eChook: {},

      // UI-only state (new design)
      tab: "overview",
      activeWizard: null,
      sendModalOpen: false,
      resetModalOpen: false,
      restoreModalOpen: false,
      restoreParsedData: null,
      toast: "",
      multimeterOffset: 0,
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
    navItems() {
      return [
        { id: "overview", label: "Overview", icon: Bolt },
        { id: "settings", label: "Settings", icon: Gear },
        { id: "backup", label: "Backup", icon: Archive },
      ];
    },
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
          return item.title && !item.hidden;
        })
        .map(([key, item]) => ({ key, item }))
        .sort((a, b) => {
          const aPriority = Object.prototype.hasOwnProperty.call(priorityMap, a.key) ? priorityMap[a.key] : 999;
          const bPriority = Object.prototype.hasOwnProperty.call(priorityMap, b.key) ? priorityMap[b.key] : 999;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.item.title.localeCompare(b.item.title);
        });
    },

    // --- New design's version/lock/5V-rail-field logic -------------------------------
    // Comms V1 boards do report a version, but only as major.minor in the legacy
    // `[v..]` packet, which this tool does not currently decode. Treat V1 as
    // "version unknown": show "-" + update-available, and leave magnets editable
    // rather than assume the firmware-2.1+ single-magnet constraint applies.
    // Comms V2 boards report major, minor and patch as raw bytes in the 0x81
    // response; handleV25Packet below records them into `firmwareVersion`.
    swVersionDisplay() {
      if (this.protocolVersion !== 2 || !this.firmwareVersion) return "-";
      const v = this.firmwareVersion;
      return `${v.major}.${v.minor}.${v.patch}`;
    },
    updateAvailable() {
      if (this.protocolVersion !== 2 || !this.firmwareVersion) return true;
      return compareVersion(this.firmwareVersion, LATEST_FIRMWARE) < 0;
    },
    magnetsLocked() {
      if (this.protocolVersion !== 2 || !this.firmwareVersion) return false;
      return compareVersion(this.firmwareVersion, MAGNETS_LOCKED_FROM) >= 0;
    },
    // `referenceVoltage` (identifier "V") is the only live-decoded rail-voltage
    // field, used the same way by both board types. `referenceVoltageStatic`
    // ("Fallback Rail Voltage") has no identifier - it's a stored fallback the
    // firmware uses internally, not something the UI calibrates live.
    fiveVoltField() {
      return "referenceVoltage";
    },
    fiveVoltLive() {
      const field = this.eChook[this.fiveVoltField];
      return field ? field.value : 0;
    },

    // --- Wizard step builders ----------------------------------------------------
    wizardCtx() {
      const self = this;
      return {
        name: computed(() => self.eChook.bluetoothName.value),
        setName: (v) => {
          self.eChook.bluetoothName.value = v;
          self.checkChange();
        },
        binary: computed(() => ({
          variableThrottle: !!self.eChook.binary.variableThrottle.value,
          throttleOut: !!self.eChook.binary.throttleOut.value,
          throttleRamp: !!self.eChook.binary.throttleRamp.value,
        })),
        setBinary: (key, v) => {
          self.eChook.binary[key].value = v ? 1 : 0;
          self.checkChange();
        },
        magnetsLocked: computed(() => self.magnetsLocked),
        speedMagnets: computed(() => self.eChook.speed.calibration.magnets.value),
        setSpeedMagnets: (v) => {
          self.eChook.speed.calibration.magnets.value = v;
          self.checkChange();
        },
        rpmMagnets: computed(() => self.eChook.rpm.calibration.magnets.value),
        setRpmMagnets: (v) => {
          self.eChook.rpm.calibration.magnets.value = v;
          self.checkChange();
        },
        circumference: computed(() => self.eChook.speed.calibration.circumference.value),
        setCircumference: (v) => {
          self.eChook.speed.calibration.circumference.value = v;
          self.checkChange();
        },
        voltageScale: computed(() => self.eChook.voltage.calibration.multiplier.value),
        voltageLowerScale: computed(() => self.eChook.voltageLower.calibration.multiplier.value),
        live: computed(() => ({
          speed: self.eChook.speed.value,
          rpm: self.eChook.rpm.value,
          fiveVoltRail: self.fiveVoltLive,
        })),
        multimeterOffset: computed(() => self.multimeterOffset),
        setMultimeterOffset: (v) => {
          self.multimeterOffset = v;
        },
        multimeterReading: computed(() => Number(self.fiveVoltLive) + self.multimeterOffset),
        exitToFiveVolt: () => {
          self.activeWizard = "fiveVoltRail";
        },
      };
    },
    setupSteps() {
      return buildSetupSteps(this.wizardCtx);
    },
    speedWizardSteps() {
      return buildSpeedWizardSteps(this.wizardCtx);
    },
    fiveVoltWizardSteps() {
      return buildFiveVoltWizardSteps(this.wizardCtx);
    },
    voltageWizardSteps() {
      const which = this.activeWizard === "voltage-total" ? "total" : "lower";
      return buildVoltageWizardSteps(this.wizardCtx, which);
    },
  },
  methods: {
    // --- New design's UI-only orchestration --------------------------------------
    showToast(msg) {
      this.toast = msg;
      setTimeout(() => {
        this.toast = "";
      }, 2800);
    },
    openWizard(id) {
      this.activeWizard = id;
    },
    openVoltageWizard(which) {
      this.activeWizard = which === "total" ? "voltage-total" : "voltage-lower";
    },
    closeWizard() {
      this.activeWizard = null;
    },
    finishSetupWizard() {
      this.activeWizard = null;
      this.showToast("Setup complete — remember to send changes.");
    },
    finishSpeedWizard() {
      this.activeWizard = null;
      this.showToast("Speed sensor calibrated — remember to send changes.");
    },
    finishFiveVoltWizard() {
      const field = this.eChook[this.fiveVoltField];
      const ratio = this.wizardCtx.multimeterReading.value / Number(this.fiveVoltLive || 5);
      const cal = field.calibration.voltage;
      cal.value = (Number(cal.value) * ratio).toFixed(cal.precision != null ? cal.precision : 2);
      this.multimeterOffset = 0;
      this.checkChange();
      this.activeWizard = null;
      this.showToast("5V rail calibrated — remember to send changes.");
    },
    finishVoltageWizard() {
      const which = this.activeWizard === "voltage-total" ? "total" : "lower";
      const label = which === "total" ? "Voltage (Total)" : "Voltage (Lower)";
      const cal = which === "total" ? this.eChook.voltage.calibration.multiplier : this.eChook.voltageLower.calibration.multiplier;
      const newScale = (Number(cal.value) * (5.0 / Number(this.fiveVoltLive || 5))).toFixed(cal.precision != null ? cal.precision : 2);
      cal.value = newScale;
      this.checkChange();
      this.activeWizard = null;
      this.showToast(`${label} calibrated — remember to send changes.`);
    },
    buildDiffs() {
      const diffs = [];
      if (this.eChook.bluetoothName.value !== this.eChook.bluetoothName.old) {
        diffs.push({ label: "Board Name", from: this.eChook.bluetoothName.old, to: this.eChook.bluetoothName.value });
      }
      for (const key in this.eChook.binary) {
        const b = this.eChook.binary[key];
        if (b.value !== b.old) {
          diffs.push({ label: b.name, from: b.old ? b.op1 : b.op2, to: b.value ? b.op1 : b.op2 });
        }
      }
      for (const itemKey in this.eChook) {
        const item = this.eChook[itemKey];
        if (Object.prototype.hasOwnProperty.call(item, "calibration")) {
          for (const calKey in item.calibration) {
            const c = item.calibration[calKey];
            if (c.value != c.old && (c.floatIndex != null || c.name)) {
              diffs.push({ label: c.name || item.title, from: c.old, to: c.value });
            }
          }
        }
      }
      return diffs;
    },
    async confirmSend() {
      await this.serialSendAllCal();
      // Reflect the just-sent values as the new baseline so the pending-change
      // count/diff view clears (protocol logic itself is untouched above).
      if (this.eChook.bluetoothName.value !== this.eChook.bluetoothName.old) {
        this.eChook.bluetoothName.old = this.eChook.bluetoothName.value;
      }
      for (const key in this.eChook.binary) {
        this.eChook.binary[key].old = this.eChook.binary[key].value;
      }
      for (const itemKey in this.eChook) {
        const item = this.eChook[itemKey];
        if (Object.prototype.hasOwnProperty.call(item, "calibration")) {
          for (const calKey in item.calibration) {
            item.calibration[calKey].old = item.calibration[calKey].value;
          }
        }
      }
      this.checkChange();
      this.sendModalOpen = false;
      this.showToast("Changes written to eChook.");
    },
    confirmReset() {
      this.resetModalOpen = false;
      this.resetEchook();
      this.showToast("Reset to factory defaults. Unplug and reconnect to continue.");
    },
    handleRestoreFileSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          this.restoreParsedData = JSON.parse(reader.result);
          this.restoreModalOpen = true;
        } catch (err) {
          this.showToast("Could not read that backup file.");
        }
      };
      reader.readAsText(file);
      e.target.value = null;
    },
    confirmRestore() {
      this.restoreModalOpen = false;
      this.applyRestoredData(this.restoreParsedData);
      this.restoreParsedData = null;
      this.showToast("Backup loaded — review then send changes.");
    },
    applyRestoredData(newCal) {
      for (let item in this.eChook) {
        if (Object.hasOwn(newCal, item)) {
          if (item === "binary") {
            for (let sub in this.eChook[item]) {
              if (Object.hasOwn(newCal[item], sub)) {
                this.eChook[item][sub].value = newCal[item][sub].value ? 1 : 0;
              }
            }
          } else if (item === "bluetoothName") {
            if (Object.hasOwn(newCal[item], "value")) {
              this.eChook[item].value = newCal[item].value;
            }
          } else if (Object.hasOwn(newCal[item], "calibration")) {
            for (let cal in this.eChook[item].calibration) {
              if (Object.hasOwn(newCal[item].calibration, cal)) {
                this.eChook[item].calibration[cal].value = newCal[item].calibration[cal].value;
              }
            }
          }
        }
      }
      this.checkChange();
    },

    // --- Everything below is unchanged serial/protocol logic ---------------------
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
      this.connecting = true;
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
        this.connecting = false;
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
      this.firmwareVersion = { major: 2, minor: 4, patch: 1 };

      // Populate some dummy data
      this.eChook.bluetoothName.value = "Demo-Device-01";
      this.eChook.bluetoothName.old = "Demo-Device-01";
      this.eChook.binary.variableThrottle.value = 1;
      this.eChook.binary.variableThrottle.old = 1;
      this.eChook.binary.throttleOut.value = 1;
      this.eChook.binary.throttleOut.old = 1;

      // Populate some calibration values
      if (this.eChook.speed && this.eChook.speed.calibration) {
        this.eChook.speed.calibration.magnets.value = 1;
        this.eChook.speed.calibration.magnets.old = 1;
        this.eChook.speed.calibration.circumference.value = 1.57;
        this.eChook.speed.calibration.circumference.old = 1.57;
        this.eChook.speed.value = "12.50";
      }
      if (this.eChook.rpm) {
        this.eChook.rpm.calibration.magnets.value = 1;
        this.eChook.rpm.calibration.magnets.old = 1;
        this.eChook.rpm.value = "3200";
      }
      if (this.eChook.voltage) {
        this.eChook.voltage.value = "25.40";
        if (this.eChook.voltage.calibration) {
          this.eChook.voltage.calibration.multiplier.value = 11.0;
          this.eChook.voltage.calibration.multiplier.old = 11.0;
        }
      }
      if (this.eChook.voltageLower) {
        this.eChook.voltageLower.value = "12.80";
        if (this.eChook.voltageLower.calibration) {
          this.eChook.voltageLower.calibration.multiplier.value = 11.0;
          this.eChook.voltageLower.calibration.multiplier.old = 11.0;
        }
      }
      if (this.eChook.current) {
        this.eChook.current.value = "15.20";
        if (this.eChook.current.calibration) {
          this.eChook.current.calibration.multiplier.value = 14.3;
          this.eChook.current.calibration.multiplier.old = 14.3;
        }
      }
      if (this.eChook.referenceVoltage) {
        this.eChook.referenceVoltage.value = "4.97";
        this.eChook.referenceVoltage.calibration.voltage.value = 1.08;
        this.eChook.referenceVoltage.calibration.voltage.old = 1.08;
      }
      if (this.eChook.throttleVoltage) this.eChook.throttleVoltage.value = "2.10";
      if (this.eChook.throttleInput) this.eChook.throttleInput.value = "48.2";
      if (this.eChook.temp1) this.eChook.temp1.value = "24";
      if (this.eChook.temp2) this.eChook.temp2.value = "23";

      this.checkChange();
      console.log("Mock Connection Started");
    },
    resetEchook() {
      if (this.protocolVersion === 2) {
        this.serialWriteV25(0x45, new Uint8Array(0));
      } else {
        let data = new Uint8Array(2);
        let text = "C"; // Clear EEPROM
        data[0] = text.charCodeAt(0);
        this.serialWrite(data);
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
      // No real port in Demo Mode - no-op instead of throwing so the demo flow
      // (send/reset) stays testable without hardware.
      if (!this.port) return;
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
        // Payload is four raw bytes: major, minor, patch, board type.
        if (data.length >= 4) {
          this.firmwareVersion = { major: data[0], minor: data[1], patch: data[2] };
          this.deviceType = data[3] === 1 ? "Nano Every" : "Standard Nano";
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

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
  color: var(--app-text);
  overflow: hidden;
}
.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.app-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 40px;
}
.diff-list {
  margin-top: 12px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--neutral-700);
  border-radius: var(--radius-sm);
  padding: 4px 12px;
}
</style>
