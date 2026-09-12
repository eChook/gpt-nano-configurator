<template>
  <div class="bottom-bar">
    <span class="count-text">{{ countText }}</span>
    <DsButton variant="primary" :disabled="count === 0" @click="$emit('send')">{{ sendText }}</DsButton>
  </div>
</template>

<script>
import DsButton from "../ds/Button.vue";

export default {
  name: "BottomBar",
  components: { DsButton },
  props: {
    count: { type: Number, required: true },
  },
  emits: ["send"],
  computed: {
    countText() {
      if (this.count === 0) return "No changes pending";
      return `${this.count} pending change${this.count === 1 ? "" : "s"}`;
    },
    sendText() {
      if (this.count === 0) return "Nothing to send";
      return `Send ${this.count} change${this.count === 1 ? "" : "s"} to eChook`;
    },
  },
};
</script>

<style scoped>
.bottom-bar {
  border-top: 1px solid var(--app-border);
  background: var(--app-surface);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
.count-text {
  font-size: 13px;
  color: var(--app-muted);
}
</style>
