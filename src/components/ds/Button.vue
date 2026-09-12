<template>
  <button
    type="button"
    class="ds-button"
    :class="[variant, size]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: "DsButton",
  props: {
    variant: { type: String, default: "primary" }, // primary | secondary | destructive | ghost
    size: { type: String, default: "md" }, // md | sm
    disabled: { type: Boolean, default: false },
  },
  emits: ["click"],
};
</script>

<style scoped>
.ds-button {
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: opacity var(--duration-fast) var(--ease-standard), background var(--duration-fast);
}
.ds-button:disabled {
  cursor: not-allowed;
  opacity: .5;
}
.ds-button.md { padding: 8px 16px; font-size: 14px; }
.ds-button.sm { padding: 6px 12px; font-size: 13px; }

.ds-button.primary {
  background: var(--brand-primary);
  color: #fff;
  border: 0;
}
.ds-button.primary:not(:disabled):hover { opacity: .9; }

.ds-button.secondary {
  background: var(--app-border);
  color: var(--app-text);
  border: 1px solid var(--app-border-strong);
}

.ds-button.destructive {
  background: #7f1d1d;
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, .4);
}

.ds-button.ghost {
  background: transparent;
  color: var(--app-text);
  border: 1px solid var(--app-border-strong);
}
</style>
