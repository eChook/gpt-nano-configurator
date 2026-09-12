<template>
  <div class="modal-overlay" @click="$emit('cancel')">
    <div class="modal-box" @click.stop>
      <div class="modal-body">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-desc">{{ description }}</p>
        <slot name="extra" />
      </div>
      <div class="modal-actions">
        <DsButton :variant="danger ? 'destructive' : 'primary'" @click="$emit('confirm')">{{ confirmLabel }}</DsButton>
        <DsButton variant="secondary" @click="$emit('cancel')">{{ cancelLabel }}</DsButton>
      </div>
    </div>
  </div>
</template>

<script>
import DsButton from "./Button.vue";

export default {
  name: "DsModal",
  components: { DsButton },
  props: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    confirmLabel: { type: String, default: "Confirm" },
    cancelLabel: { type: String, default: "Cancel" },
    danger: { type: Boolean, default: false },
  },
  emits: ["confirm", "cancel"],
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 16px;
}
.modal-box {
  width: 100%;
  max-width: 384px;
  background: var(--neutral-900);
  border: 1px solid var(--neutral-700);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-modal-dark);
  overflow: hidden;
  font-family: var(--font-sans);
}
.modal-body {
  padding: 20px 24px 16px;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}
.modal-desc {
  font-size: 14px;
  color: var(--neutral-400);
  margin: 0;
  line-height: 1.5;
}
.modal-actions {
  padding: 12px 24px 20px;
  display: flex;
  flex-direction: row-reverse;
  gap: 8px;
}
</style>
