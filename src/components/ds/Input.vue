<template>
  <div class="ds-input-wrap">
    <label v-if="label" class="ds-input-label" :class="{ micro }">{{ label }}</label>
    <input
      class="ds-input"
      :type="type"
      :value="modelValue"
      :disabled="disabled"
      :step="step"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script>
export default {
  name: "DsInput",
  props: {
    label: { type: String, default: "" },
    micro: { type: Boolean, default: false },
    type: { type: String, default: "text" },
    modelValue: { type: [String, Number], default: "" },
    disabled: { type: Boolean, default: false },
    step: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
  },
  emits: ["update:modelValue"],
};
</script>

<style scoped>
.ds-input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-muted);
  font-family: var(--font-sans);
}
.ds-input-label.micro {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
}
.ds-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--app-surface);
  border: 1px solid var(--app-border-strong);
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: 14px;
  color: var(--app-text);
  outline: none;
  font-family: var(--font-sans);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}
.ds-input:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 1px var(--brand-primary);
}
.ds-input:disabled {
  opacity: .6;
  cursor: not-allowed;
}
</style>
