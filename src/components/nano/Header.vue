<template>
  <div class="app-header">
    <div class="left">
      <div class="wordmark">
        <span class="brand-echook">eChook</span><span class="brand-nano">Nano</span>
      </div>
      <div class="divider"></div>
      <span class="subtitle">Configuration Tool</span>
    </div>
    <div class="right">
      <span class="name">{{ name }}</span>
      <DsBadge status="live" label="Connected" pulse />
      <DsIconButton :label="'Disconnect'" danger @click="$emit('disconnect')">
        <Power :size="18" />
      </DsIconButton>
    </div>
  </div>
</template>

<script>
import DsBadge from "../ds/Badge.vue";
import DsIconButton from "../ds/IconButton.vue";
import { Power } from "../icons/nanoIcons";

export default {
  name: "AppHeader",
  components: { DsBadge, DsIconButton, Power },
  props: {
    name: { type: String, required: true },
  },
  emits: ["disconnect"],
};
</script>

<style scoped>
.app-header {
  height: var(--header-height);
  background: var(--app-bg);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 16px;
  flex-shrink: 0;
}
.left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.wordmark {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.brand-echook {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text);
  line-height: 1;
}
.brand-nano {
  font-size: 18px;
  font-weight: 700;
  color: var(--brand-primary);
  line-height: 1;
}
.divider {
  height: 22px;
  width: 1px;
  background: var(--app-border-strong);
}
.subtitle {
  font-size: 13px;
  color: var(--app-muted);
  font-weight: 500;
  white-space: nowrap;
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--app-text);
}
</style>
