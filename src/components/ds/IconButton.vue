<template>
  <button
    type="button"
    class="ds-icon-button"
    :class="{ active, danger }"
    :title="label"
    :aria-label="label"
    :style="{ width: size + 'px', height: size + 'px' }"
    @click="$emit('click', $event)"
  >
    <slot />
    <span v-if="active" class="active-tab" />
  </button>
</template>

<script>
export default {
  name: "DsIconButton",
  props: {
    label: { type: String, default: "" },
    active: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    size: { type: Number, default: 44 },
  },
  emits: ["click"],
};
</script>

<style scoped>
.ds-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-border);
  color: var(--app-text);
  border: 1px solid var(--app-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  position: relative;
  transition: all var(--duration-fast) var(--ease-standard);
}
.ds-icon-button.active {
  background: rgba(203, 21, 87, .1);
  color: var(--brand-primary);
  border: none;
}
.ds-icon-button:not(.active):hover {
  background: var(--app-border-strong);
}
.ds-icon-button.danger:not(.active):hover {
  background: rgba(244, 63, 94, .2);
  color: var(--status-destructive-hover);
}
.active-tab {
  position: absolute;
  left: -12px;
  width: 4px;
  height: 24px;
  background: var(--brand-primary);
  border-radius: 0 9999px 9999px 0;
}
</style>
