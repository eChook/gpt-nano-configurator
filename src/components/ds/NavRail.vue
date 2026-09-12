<template>
  <div class="nav-rail">
    <div
      v-for="it in items"
      :key="it.id"
      class="nav-item"
      :class="{ active: it.id === activeId }"
      :title="it.label"
      @click="$emit('select', it.id)"
    >
      <component :is="it.icon" :size="22" />
      <span v-if="it.id === activeId" class="active-tab" />
    </div>
  </div>
</template>

<script>
export default {
  name: "DsNavRail",
  props: {
    items: { type: Array, required: true }, // [{ id, label, icon: component }]
    activeId: { type: String, default: "" },
  },
  emits: ["select"],
};
</script>

<style scoped>
.nav-rail {
  width: var(--nav-rail-width);
  background: var(--app-bg);
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 16px;
  font-family: var(--font-sans);
  flex-shrink: 0;
}
.nav-item {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-muted);
  cursor: pointer;
}
.nav-item.active {
  background: rgba(203, 21, 87, .1);
  color: var(--brand-primary);
}
.active-tab {
  position: absolute;
  left: -12px;
  width: 4px;
  height: 24px;
  background: var(--brand-primary);
  border-radius: 0 9999px 9999px 0;
}
</style>
