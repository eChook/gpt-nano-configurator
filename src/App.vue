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
/* cabin-regular - latin */
@font-face {
  font-family: 'Cabin';
  font-style: normal;
  font-weight: 400;
  src: local(''),
       url('/assets/fonts/cabin-v18-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
       url('/assets/fonts/cabin-v18-latin-regular.woff') format('woff'), /* Modern Browsers */
       url('/assets/fonts/cabin-v18-latin-regular.ttf') format('truetype'), /* Safari, Android, iOS */
}

/* oswald-regular - latin */
@font-face {
  font-family: 'Oswald';
  font-style: normal;
  font-weight: 400;
  src: local(''),
       url('/assets/fonts/oswald-v41-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/assets/fonts/oswald-v41-latin-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}

/* raleway-regular - latin */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 400;
  src: local(''),
       url('/assets/fonts/raleway-v26-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/assets/fonts/raleway-v26-latin-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* raleway-500 - latin */
/* @font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 500;
  src: local(''),
       url('/assets/fonts/raleway-v26-latin-500.woff2') format('woff2'), 
       url('/assets/fonts/raleway-v26-latin-500.woff') format('woff'); 
} */

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
  background: #fff;
  animation: lds-grid 1.2s linear infinite;
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
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

body{
    margin: 0;
    padding:0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: px; */
}
</style>
