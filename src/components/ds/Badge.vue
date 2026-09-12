<template>
  <span class="ds-badge">
    <span class="dot" :class="{ pulse }" :style="{ background: dotColor }"></span>
    <span class="label">{{ label }}</span>
    <span v-if="age" class="age">{{ age }}</span>
  </span>
</template>

<script>
const STATUS_COLOR = {
  live: "var(--status-live)",
  stale: "var(--status-stale)",
  offline: "var(--status-offline)",
  info: "var(--status-info)",
  warning: "var(--status-warning)",
};

export default {
  name: "DsBadge",
  props: {
    status: { type: String, default: "live" },
    label: { type: String, default: "" },
    age: { type: String, default: "" },
    pulse: { type: Boolean, default: false },
  },
  computed: {
    dotColor() {
      return STATUS_COLOR[this.status] || STATUS_COLOR.live;
    },
  },
};
</script>

<style scoped>
.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--app-border);
  border: 1px solid var(--app-border-strong);
  font-family: var(--font-sans);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}
.dot.pulse {
  animation: echookPulse 2s ease-in-out infinite;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.age {
  font-size: 10px;
  font-weight: 700;
  color: var(--app-text);
}
</style>
