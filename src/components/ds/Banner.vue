<template>
  <div class="ds-banner" :class="tone">
    <span v-if="pulse" class="dot"></span>
    <span class="text"><slot /></span>
    <span v-if="action" class="action">{{ action }}</span>
  </div>
</template>

<script>
export default {
  name: "DsBanner",
  props: {
    tone: { type: String, default: "info" }, // warning | info | danger
    action: { type: String, default: "" },
    pulse: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.ds-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  font-family: var(--font-sans);
}
.ds-banner.info {
  background: rgba(203, 21, 87, .06);
  border: 1px solid rgba(203, 21, 87, .2);
}
.ds-banner.warning {
  background: rgba(120, 53, 15, .15);
  border: 1px solid #f59e0b;
}
.ds-banner.danger {
  background: rgba(127, 29, 29, .9);
  border: 1px solid #ef4444;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: currentColor;
  animation: echookPulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
.ds-banner.info .dot { color: var(--brand-primary); }
.ds-banner.warning .dot { color: #fcd34d; }
.ds-banner.danger .dot { color: #ef4444; }
.text {
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}
.ds-banner.info .text { color: var(--app-text); }
.ds-banner.warning .text { color: #fef3c7; }
.ds-banner.danger .text { color: #fee2e2; }
.action {
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}
.ds-banner.info .action { color: var(--brand-primary); }
.ds-banner.warning .action { color: #fcd34d; }
.ds-banner.danger .action { color: #ef4444; }
</style>
