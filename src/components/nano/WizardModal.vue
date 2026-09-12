<template>
  <div class="wizard-overlay" @click="$emit('close')">
    <div class="wizard-box" @click.stop>
      <div class="wizard-head">
        <div>
          <div class="eyebrow">{{ title }} &middot; Step {{ step + 1 }} of {{ steps.length }}</div>
          <h3 class="step-title">{{ steps[step].title }}</h3>
        </div>
        <span class="close-btn" @click="$emit('close')"><XMark :size="20" /></span>
      </div>
      <div class="progress-row">
        <span
          v-for="(s, i) in steps"
          :key="i"
          class="progress-seg"
          :style="{ background: i <= step ? 'var(--brand-primary)' : 'var(--neutral-700)' }"
        ></span>
      </div>
      <div class="wizard-body">
        <component :is="stepRenderer" />
      </div>
      <div class="wizard-actions">
        <DsButton variant="ghost" @click="back">{{ step === 0 ? "Cancel" : "Back" }}</DsButton>
        <DsButton variant="primary" @click="next">{{ last ? "Finish" : (steps[step].nextLabel || "Next") }}</DsButton>
      </div>
    </div>
  </div>
</template>

<script>
import DsButton from "../ds/Button.vue";
import { XMark } from "../icons/nanoIcons";

export default {
  name: "WizardModal",
  components: { DsButton, XMark },
  props: {
    title: { type: String, required: true },
    steps: { type: Array, required: true }, // [{ title, nextLabel, render: () => VNode }]
  },
  emits: ["close", "finish"],
  data() {
    return { step: 0 };
  },
  computed: {
    last() {
      return this.step === this.steps.length - 1;
    },
    stepRenderer() {
      const renderFn = this.steps[this.step].render;
      return { render: renderFn };
    },
  },
  methods: {
    back() {
      if (this.step === 0) this.$emit("close");
      else this.step -= 1;
    },
    next() {
      if (this.last) this.$emit("finish");
      else this.step += 1;
    },
  },
};
</script>

<style scoped>
.wizard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 16px;
}
.wizard-box {
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--neutral-900);
  border: 1px solid var(--neutral-700);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-modal-dark);
  font-family: var(--font-sans);
}
.wizard-head {
  padding: 20px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--neutral-400);
}
.step-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.close-btn {
  color: var(--neutral-400);
  cursor: pointer;
  display: inline-flex;
}
.progress-row {
  display: flex;
  gap: 6px;
  padding: 16px 24px;
}
.progress-seg {
  height: 4px;
  flex: 1;
  border-radius: 2px;
}
.wizard-body {
  padding: 0 24px 8px;
  min-height: 160px;
  color: var(--neutral-300);
}
.wizard-actions {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--neutral-700);
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
</style>
