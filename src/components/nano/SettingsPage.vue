<template>
  <div>
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Behaviour toggles stored in the board's EEPROM.</p>
    <Panel title="Throttle Behaviour" helper="Changes here take effect after Send changes.">
      <SegmentedChoice
        label="Throttle Type"
        onLabel="Variable"
        offLabel="On / Off"
        :checked="!!binary.variableThrottle.value"
        @change="(v) => setBinary('variableThrottle', v)"
      />
      <SegmentedChoice
        label="Throttle Output (PWM)"
        onLabel="On"
        offLabel="Off"
        :checked="!!binary.throttleOut.value"
        @change="(v) => setBinary('throttleOut', v)"
      />
      <SegmentedChoice
        label="Throttle Ramp"
        onLabel="On"
        offLabel="Off"
        :checked="!!binary.throttleRamp.value"
        @change="(v) => setBinary('throttleRamp', v)"
      />
    </Panel>
  </div>
</template>

<script>
import Panel from "./Panel.vue";
import SegmentedChoice from "../ds/SegmentedChoice.vue";

export default {
  name: "SettingsPage",
  components: { Panel, SegmentedChoice },
  props: {
    binary: { type: Object, required: true },
  },
  emits: ["changed"],
  methods: {
    setBinary(key, val) {
      this.binary[key].value = val ? 1 : 0;
      this.$emit("changed");
    },
  },
};
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--app-text);
}
.page-subtitle {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0 0 20px;
}
</style>
