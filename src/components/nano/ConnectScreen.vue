<template>
  <div class="connect-screen">
    <div class="card">
      <div class="wordmark">
        <span class="brand-echook">eChook</span><span class="brand-nano">Nano</span>
      </div>
      <p class="subtitle">Configuration Tool</p>

      <div v-if="!hasSerial" class="warn-box">
        <Warn :size="20" />
        <span>This browser doesn't support WebSerial, so it can't connect to an eChook Nano. Open this page in <strong>Chrome</strong> or <strong>Edge</strong> on desktop instead.</span>
      </div>

      <div class="plug-badge"><Plug :size="28" /></div>

      <div v-if="connecting">
        <div class="dots">
          <span class="nano-dot" style="animation-delay:0ms"></span>
          <span class="nano-dot" style="animation-delay:150ms"></span>
          <span class="nano-dot" style="animation-delay:300ms"></span>
        </div>
        <p class="reading-text">Reading calibration from board&hellip;</p>
      </div>
      <div v-else>
        <p class="intro">Plug in your eChook Nano over USB, then connect to read its live calibration and settings.</p>
        <DsButton :disabled="!hasSerial" style="width:100%; padding:12px 16px; font-size:15px" @click="$emit('connect')">Connect</DsButton>
        <div class="demo-trigger" @click="$emit('demo')">Demo Mode</div>
      </div>

      <p v-if="hasSerial" class="footnote">Only <strong>Chrome</strong> and <strong>Edge</strong> desktop browsers support the WebSerial connection this tool needs.</p>
    </div>
  </div>
</template>

<script>
import DsButton from "../ds/Button.vue";
import { Plug, Warn } from "../icons/nanoIcons";

export default {
  name: "ConnectScreen",
  components: { DsButton, Plug, Warn },
  props: {
    connecting: { type: Boolean, default: false },
    hasSerial: { type: Boolean, default: false },
  },
  emits: ["connect", "demo"],
};
</script>

<style scoped>
.connect-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  padding: 20px;
}
.card {
  width: 100%;
  max-width: 440px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  border-radius: var(--radius-lg);
  padding: 36px;
  text-align: center;
  box-shadow: var(--shadow-2xl);
}
.wordmark {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 6px;
}
.brand-echook {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text);
  line-height: 1;
}
.brand-nano {
  font-size: 26px;
  font-weight: 700;
  color: var(--brand-primary);
  line-height: 1;
}
.subtitle {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0 0 28px;
  font-weight: 600;
  letter-spacing: .02em;
}
.warn-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-align: left;
  padding: 14px;
  margin-bottom: 20px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(239, 68, 68, .5);
  background: rgba(127, 29, 29, .15);
  color: #fca5a5;
  font-size: 13px;
  line-height: 1.5;
}
.plug-badge {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: rgba(203, 21, 87, .1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--brand-primary);
}
.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 14px;
}
.nano-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-primary);
  animation: nanoBounce 1s ease-in-out infinite;
  display: inline-block;
}
@keyframes nanoBounce {
  0%, 100% { transform: translateY(0); opacity: .4; }
  50% { transform: translateY(-6px); opacity: 1; }
}
.reading-text {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0;
}
.intro {
  font-size: 13px;
  color: var(--app-muted);
  line-height: 1.6;
  margin: 0 0 20px;
}
.demo-trigger {
  margin-top: 20px;
  color: var(--app-muted);
  opacity: .5;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  transition: opacity .3s;
}
.demo-trigger:hover {
  opacity: 1;
}
.footnote {
  font-size: 11px;
  color: var(--app-muted);
  margin: 24px 0 0;
  line-height: 1.5;
}
</style>
