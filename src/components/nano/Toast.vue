<template>
  <div v-if="text" class="toast">{{ text }}</div>
</template>

<script>
export default {
  name: "Toast",
  props: {
    text: { type: String, default: "" },
  },
};
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--neutral-900);
  color: #fff;
  border: 1px solid var(--neutral-700);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  font-size: 13px;
  box-shadow: var(--shadow-2xl);
  z-index: 80;
  font-family: var(--font-sans);
}
</style>
