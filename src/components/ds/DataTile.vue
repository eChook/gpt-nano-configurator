<template>
  <div class="data-tile" :class="tone" :style="{ opacity: stale ? 0.5 : 1, filter: stale ? 'grayscale(1)' : 'none' }">
    <span class="tile-label">
      {{ label }}<span v-if="unit" class="tile-unit"> ({{ unit }})</span>
    </span>
    <span class="tile-value" :style="valueColor ? { color: valueColor } : {}">{{ value }}</span>
  </div>
</template>

<script>
export default {
  name: "DataTile",
  props: {
    label: { type: String, required: true },
    unit: { type: String, default: "" },
    value: { type: [String, Number], default: "" },
    tone: { type: String, default: "normal" }, // normal | warning | critical
    stale: { type: Boolean, default: false },
    valueColor: { type: String, default: "" },
  },
};
</script>

<style scoped>
.data-tile {
  min-width: 128px;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--app-border);
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: var(--shadow-card);
}
.data-tile.warning {
  border-color: #f59e0b;
  background: rgba(120, 53, 15, .15);
}
.data-tile.critical {
  border-color: #ef4444;
  background: rgba(127, 29, 29, .15);
}
.tile-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--app-muted);
  font-weight: 700;
  letter-spacing: .05em;
  text-align: center;
}
.tile-unit {
  font-weight: 400;
}
.tile-value {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text);
}
.data-tile.warning .tile-value {
  color: #fcd34d;
}
</style>
