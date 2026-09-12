<template>
  <div class="review-row">
    <span class="rr-label">{{ label }}</span>
    <span class="rr-value">{{ value }}</span>
  </div>
</template>

<script>
export default {
  name: "ReviewRow",
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
  },
};
</script>

<style scoped>
.review-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--neutral-700);
}
.rr-label {
  font-size: 13px;
  color: var(--neutral-400);
  font-family: var(--font-sans);
}
.rr-value {
  font-size: 13px;
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 700;
}
</style>
