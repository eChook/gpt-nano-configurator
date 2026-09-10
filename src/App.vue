<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" /> -->
  <Header />

  <Connect />
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
// import HelloWorld from "./components/HelloWorld.vue";
import Header from "./components/Header.vue";
import Connect from "./components/Connect.vue";

export default defineComponent({
  name: "App",
  components: {
    // HelloWorld,
    Header,
    Connect,
  },
});
</script>

<style>
:root {
  --rosewood: #BD285A;
  --midnight-violet: #222b38;
  --pacific-blue: #9ba9bf;
  --ghost-white: #f2f5fa;
  --dark-slate-grey: #687388;
  --honey-bronze: #bea26d;
  --rusty-spice: #98704d;
  --yellow-green: #aeb8c8;

  --app-bg: #202938;
  --bg-gradient: linear-gradient(135deg, #202938 0%, #2d3849 100%);
  --glass-bg: rgba(242, 245, 250, 0.06);
  --glass-border: rgba(242, 245, 250, 0.18);
  --panel-bg: rgba(242, 245, 250, 0.11);
  --panel-bg-hover: rgba(242, 245, 250, 0.16);
  --panel-border: rgba(242, 245, 250, 0.24);
}

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

/* raleway-regular - latin */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 400;
  src: local(''),
    url('@/assets/fonts/raleway-v26-latin-regular.woff2') format('woff2');
}

/* Spinner */
.lds-grid {
  display: inline-block;
  position: relative;
  margin: 30vh auto;
  width: 80px;
  height: 80px;
}

.lds-grid div {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--rosewood);
  animation: lds-grid 1.2s linear infinite;
  box-shadow: none;
}

.lds-grid div:nth-child(1) {
  top: 8px;
  left: 8px;
  animation-delay: 0s;
}

.lds-grid div:nth-child(2) {
  top: 8px;
  left: 32px;
  animation-delay: -0.4s;
}

.lds-grid div:nth-child(3) {
  top: 8px;
  left: 56px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(4) {
  top: 32px;
  left: 8px;
  animation-delay: -0.4s;
}

.lds-grid div:nth-child(5) {
  top: 32px;
  left: 32px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(6) {
  top: 32px;
  left: 56px;
  animation-delay: -1.2s;
}

.lds-grid div:nth-child(7) {
  top: 56px;
  left: 8px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(8) {
  top: 56px;
  left: 32px;
  animation-delay: -1.2s;
}

.lds-grid div:nth-child(9) {
  top: 56px;
  left: 56px;
  animation-delay: -1.6s;
}

@keyframes lds-grid {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.3;
    transform: scale(0.5);
  }
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--app-bg);
  color: var(--ghost-white);
  font-family: 'Cabin', sans-serif;
  overflow: hidden;
}

#app {
  font-family: 'Cabin', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--app-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--dark-slate-grey);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--pacific-blue);
}
</style>
