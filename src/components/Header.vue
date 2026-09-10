<template>
  <div class="header-container">
    <div class="logo">eChook</div>
    <div class="site-header">eChook Nano Configuration</div>
  </div>
</template>

<script>
export default {
  return: {
    data: {
      anything: null,
    },
  },
};
</script>

<style scoped lang="scss">
// @import url('https://fonts.googleapis.com/css2?family=Cabin&family=Oswald&display=swap');

.header-container {
  top: 0px;
  left: 0px;
  display: grid;
  grid-template-columns: 175px 1fr 175px;
  background-color: var(--app-bg);
  border-bottom: 2px solid var(--glass-border);
  z-index: 10;
}

.logo {
  grid-column: 1;
  background-color: var(--rosewood);
  font-family: 'Oswald', sans-serif;
  text-align: right;
  vertical-align: bottom;
  height: 70px;
  color: var(--ghost-white);
  font-size: 50px;
  padding-right: 15px;
  padding-bottom: 5px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
}

.site-header {
  grid-column: 2;
  color: var(--ghost-white);
  height: 70px;
  font-size: 24px;
  font-family: 'Cabin', sans-serif;
  padding-top: 22px;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.9;
}
</style>
