<template>
  <div class="segmented-row">
    <span class="label">{{ label }}</span>
    <div class="options">
      <span
        class="option"
        :class="{ active: checked === true }"
        @click="$emit('change', true)"
      >{{ onLabel }}</span>
      <span
        class="option"
        :class="{ active: checked === false }"
        @click="$emit('change', false)"
      >{{ offLabel }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "SegmentedChoice",
  props: {
    label: { type: String, required: true },
    onLabel: { type: String, required: true },
    offLabel: { type: String, required: true },
    checked: { type: Boolean, required: true },
  },
  emits: ["change"],
};
</script>

<style scoped>
.segmented-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--app-border);
  flex-wrap: wrap;
}
.label {
  font-size: 14px;
  color: var(--app-text);
  font-weight: 500;
}
.options {
  display: flex;
  gap: 8px;
}
.option {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  background: var(--app-border);
  color: var(--app-muted);
  border: 1px solid var(--app-border-strong);
}
.option.active {
  background: rgba(203, 21, 87, .15);
  color: #f9a8c4;
  border: 1px solid rgba(203, 21, 87, .5);
}
</style>
