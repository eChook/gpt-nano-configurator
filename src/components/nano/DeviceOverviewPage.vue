<template>
  <div class="page-narrow">
    <div class="setup-row" :class="{ highlight: eChook.bluetoothName.value === 'eChook' }">
      <span v-if="eChook.bluetoothName.value === 'eChook'" class="setup-hint">First time with this board? Run the setup wizard to set its name, throttle behaviour and speed sensor.</span>
      <DsButton variant="secondary" size="sm" style="margin-left:auto" @click="$emit('run-setup')">Setup wizard</DsButton>
    </div>

    <div v-if="changeCount > 0" style="margin-bottom:16px">
      <DsBanner tone="warning" action="Review & send">{{ changeCount }} unsent change{{ changeCount === 1 ? "" : "s" }} &mdash; edits below are not live on the board until sent.</DsBanner>
    </div>

    <h1 class="section-title">Device</h1>
    <Panel title="Device Identity">
      <DsInput
        label="Board / Bluetooth Name"
        v-model="eChook.bluetoothName.value"
        placeholder="e.g. Kestrel-07"
        @update:modelValue="$emit('changed')"
      />
      <div class="identity-grid">
        <div>
          <div class="stat-label">Firmware Version</div>
          <div class="stat-row">
            <div class="stat-value">{{ swVersionDisplay }}</div>
            <a v-if="updateAvailable" href="https://github.com/eChook/eChook-Arduino-Nano/releases" target="_blank" rel="noopener" class="update-pill">Update available</a>
          </div>
        </div>
        <div>
          <div class="stat-label">Arduino Type</div>
          <div class="stat-value">{{ deviceType }}</div>
        </div>
      </div>
    </Panel>

    <h1 class="section-title">Live Readings</h1>
    <div class="tile-grid">
      <DataTile
        v-for="entry in orderedDisplayItems"
        :key="entry.key"
        :label="entry.item.title"
        :unit="entry.item.units || ''"
        :value="displayValue(entry)"
        :tone="warningTone(entry)"
      />
    </div>

    <h1 class="section-title">Calibrations</h1>

    <Panel
      title="Calibrate 5V Rail"
      helper="Used as the reference for every analogue reading on this board - it is very important that this is right! Calibrate it against a good quality multimeter for best results. It is normal for this not to be exactly 5V - and often closer to 4.7v when powered by USB."
    >
      <template #action>
        <DsButton variant="secondary" size="sm" @click="$emit('open-fivevolt-wizard')">Calibrate 5V rail</DsButton>
      </template>
      <DataTile label="Board's 5V Rail" unit="V" :value="fmt(fiveVoltLive, 2)" />
    </Panel>

    <Panel title="Voltage" helper="Scaling factors for the total and lower pack voltage sense circuits.">
      <div class="cal-row-grid">
        <div class="cal-row">
          <DataTile label="Voltage (Total)" unit="V" :value="fmt(eChook.voltage.value, 2)" />
          <div class="cal-row-fields">
            <DsInput label="Voltage (Total) Scaling Factor" type="number" step="any" v-model="eChook.voltage.calibration.multiplier.value" @update:modelValue="$emit('changed')" />
            <DsButton variant="secondary" size="sm" style="margin-top:10px" @click="$emit('open-voltage-wizard', 'total')">Guided calibration</DsButton>
          </div>
        </div>
        <div class="cal-row">
          <DataTile label="Voltage (Lower)" unit="V" :value="fmt(eChook.voltageLower.value, 2)" />
          <div class="cal-row-fields">
            <DsInput label="Voltage (Lower) Scaling Factor" type="number" step="any" v-model="eChook.voltageLower.calibration.multiplier.value" @update:modelValue="$emit('changed')" />
            <DsButton variant="secondary" size="sm" style="margin-top:10px" @click="$emit('open-voltage-wizard', 'lower')">Guided calibration</DsButton>
          </div>
        </div>
      </div>
    </Panel>

    <Panel title="Current" helper="Scaling factor for the current sense circuit.">
      <div class="cal-row">
        <DataTile label="Current" unit="A" :value="fmt(eChook.current.value, 2)" />
        <div class="cal-row-fields">
          <DsInput label="Current Scaling Factor" type="number" step="any" v-model="eChook.current.calibration.multiplier.value" @update:modelValue="$emit('changed')" />
        </div>
      </div>
    </Panel>

    <Panel title="Throttle" helper="Low / high thresholds mapping input voltage to a 0-100% throttle reading.">
      <div class="cal-row">
        <div style="display:flex; gap:12px; flex-wrap:wrap">
          <DataTile label="Throttle Input" unit="V" :value="fmt(eChook.throttleVoltage.value, 2)" />
          <DataTile label="Throttle" unit="%" :value="fmt(eChook.throttleInput.value, 1)" />
        </div>
        <div class="cal-row-fields cal-row-fields-grid">
          <DsInput label="Low Threshold (V)" type="number" step="any" v-model="eChook.throttleInput.calibration.lowThreshold.value" @update:modelValue="$emit('changed')" />
          <DsInput label="High Threshold (V)" type="number" step="any" v-model="eChook.throttleInput.calibration.highThreshold.value" @update:modelValue="$emit('changed')" />
        </div>
      </div>
    </Panel>

    <Panel title="Temperature 1" helper="Steinhart-Hart coefficients for sensor 1.">
      <div class="cal-row">
        <DataTile label="Temp 1" unit="°C" :value="fmt(eChook.temp1.value, 0)" :tone="Number(eChook.temp1.value) >= 65 ? 'warning' : 'normal'" />
        <div class="cal-row-fields cal-row-fields-grid">
          <DsInput label="Cal A" type="number" step="any" v-model="eChook.temp1.calibration.A.value" @update:modelValue="$emit('changed')" />
          <DsInput label="Cal B" type="number" step="any" v-model="eChook.temp1.calibration.B.value" @update:modelValue="$emit('changed')" />
          <DsInput label="Cal C" type="number" step="any" v-model="eChook.temp1.calibration.C.value" @update:modelValue="$emit('changed')" />
        </div>
      </div>
    </Panel>

    <Panel title="Temperature 2" helper="Steinhart-Hart coefficients for sensor 2.">
      <div class="cal-row">
        <DataTile label="Temp 2" unit="°C" :value="fmt(eChook.temp2.value, 0)" :tone="Number(eChook.temp2.value) >= 65 ? 'warning' : 'normal'" />
        <div class="cal-row-fields cal-row-fields-grid">
          <DsInput label="Cal A" type="number" step="any" v-model="eChook.temp2.calibration.A.value" @update:modelValue="$emit('changed')" />
          <DsInput label="Cal B" type="number" step="any" v-model="eChook.temp2.calibration.B.value" @update:modelValue="$emit('changed')" />
          <DsInput label="Cal C" type="number" step="any" v-model="eChook.temp2.calibration.C.value" @update:modelValue="$emit('changed')" />
        </div>
      </div>
    </Panel>

    <Panel title="Speed" helper="Wheel-speed sensor calibration.">
      <template #action>
        <DsButton variant="secondary" size="sm" @click="$emit('open-wizard', 'speed')">Guided calibration</DsButton>
      </template>
      <div class="cal-row">
        <DataTile label="Speed" unit="m/s" :value="fmt(eChook.speed.value, 2)" />
        <div class="cal-row-fields cal-row-fields-grid">
          <div>
            <DsInput label="Speed Magnets" type="number" :disabled="magnetsLocked" v-model="eChook.speed.calibration.magnets.value" @update:modelValue="$emit('changed')" />
            <div v-if="magnetsLocked" class="lock-note">Locked to 1 - firmware 2.1+ requires exactly one magnet per sensor.</div>
          </div>
          <DsInput label="Wheel Circumference (m)" type="number" step="any" v-model="eChook.speed.calibration.circumference.value" @update:modelValue="$emit('changed')" />
        </div>
      </div>
    </Panel>

    <Panel title="RPM" helper="Motor RPM pickup calibration.">
      <div class="cal-row">
        <DataTile label="Motor RPM" unit="rpm" :value="fmt(eChook.rpm.value, 0)" />
        <div class="cal-row-fields">
          <DsInput label="RPM Magnets" type="number" :disabled="magnetsLocked" v-model="eChook.rpm.calibration.magnets.value" @update:modelValue="$emit('changed')" />
          <div v-if="magnetsLocked" class="lock-note">Locked to 1 - firmware 2.1+ requires exactly one magnet per sensor.</div>
        </div>
      </div>
    </Panel>
  </div>
</template>

<script>
import DsButton from "../ds/Button.vue";
import DsInput from "../ds/Input.vue";
import DsBanner from "../ds/Banner.vue";
import DataTile from "../ds/DataTile.vue";
import Panel from "./Panel.vue";

export default {
  name: "DeviceOverviewPage",
  components: { DsButton, DsInput, DsBanner, DataTile, Panel },
  props: {
    eChook: { type: Object, required: true },
    orderedDisplayItems: { type: Array, required: true },
    changeCount: { type: Number, required: true },
    magnetsLocked: { type: Boolean, required: true },
    deviceType: { type: String, required: true },
    swVersionDisplay: { type: String, required: true },
    updateAvailable: { type: Boolean, required: true },
    fiveVoltLive: { type: [Number, String], default: 0 },
  },
  emits: ["changed", "run-setup", "open-wizard", "open-voltage-wizard", "open-fivevolt-wizard"],
  methods: {
    fmt(v, p) {
      const n = Number(v);
      if (isNaN(n)) return v == null ? "--" : v;
      return n.toFixed(p == null ? 2 : p);
    },
    displayValue(entry) {
      if (entry.item.value == null) return "--";
      return entry.item.value;
    },
    warningTone(entry) {
      const key = entry.key;
      if ((key === "temp1" || key === "temp2" || key === "temp3") && Number(entry.item.value) >= 65) return "warning";
      return "normal";
    },
  },
};
</script>

<style scoped>
.page-narrow {
  max-width: 900px;
  margin: 0 auto;
}
.setup-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.setup-row.highlight {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(59, 130, 246, .4);
  background: rgba(30, 58, 138, .15);
}
.setup-hint {
  font-size: 13px;
  color: var(--app-text);
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  margin: 28px 0 12px;
  color: var(--app-text);
}
.identity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--app-muted);
  margin-bottom: 6px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text);
}
.update-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #f472a0;
  background: rgba(203, 21, 87, .12);
  border: 1px solid rgba(203, 21, 87, .4);
  border-radius: var(--radius-full);
  padding: 2px 8px;
  text-decoration: none;
}
.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.cal-row-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.cal-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.cal-row-fields {
  flex: 1;
  min-width: 180px;
}
.cal-row-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.lock-note {
  font-size: 11px;
  color: var(--app-muted);
  margin-top: 4px;
}
</style>
