<template>
  <Connect />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Connect from "./components/Connect.vue";

export default defineComponent({
  name: "App",
  components: {
    Connect,
  },
});
</script>

<style>
@import './assets/tokens/index.css';

/* cabin-regular - latin */
@font-face {
  font-family: 'Cabin';
  font-style: normal;
  font-weight: 400;
  src: local(''),
    url('@/assets/fonts/cabin-v18-latin-regular.woff2') format('woff2');
}

/* oswald-regular - latin */
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 400;
  src: local(''),
    url('@/assets/fonts/oswald-v41-latin-regular.woff2') format('woff2');
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--app-bg);
  color: var(--app-text);
  font-family: var(--font-sans);
  overflow: hidden;
}

#app {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--app-link);
}
a:hover {
  color: var(--brand-primary);
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--app-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--app-border-strong);
  border-radius: 8px;
}
</style>
