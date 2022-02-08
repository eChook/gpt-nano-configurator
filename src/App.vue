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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: px; */
}
</style>
