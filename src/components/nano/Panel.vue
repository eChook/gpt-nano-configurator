<template>
  <div class="panel">
    <div class="panel-head" :class="{ tight: helper }">
      <h2 class="panel-title">{{ title }}</h2>
      <div v-if="$slots.action" class="panel-action"><slot name="action" /></div>
    </div>
    <p v-if="helper" class="panel-helper">{{ helper }}</p>
    <slot />
  </div>
</template>

<script>
export default {
  name: "Panel",
  props: {
    title: { type: String, required: true },
    helper: { type: String, default: "" },
  },
};
</script>

<style scoped>
.panel {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.panel-head.tight {
  margin-bottom: 4px;
}
.panel-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--app-text);
}
.panel-helper {
  font-size: 12px;
  color: var(--app-muted);
  margin: 0 0 14px;
  line-height: 1.5;
  max-width: 640px;
}
</style>
