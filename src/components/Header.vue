<template>
  <div class="header-container">
    <div class="logo">eChook</div>
    <div class="site-header">Greenpower Telemetry Calibration</div>
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
  background-color: #1c2331;
}

.logo {
  grid-column: 1;
  background-color: #e91e63;
  font-family: Oswald;
  text-align: right;
  vertical-align: bottom;
  height: 70px;
  color: #f9f9f9;
  font-size: 50px;
  padding-right: 10px;
  padding-bottom: 5px;
}
.site-header {
  grid-column: 2;
  color: #f9f9f9;
  height: 70px;
  font-size: 30px;
  font-family: Cabin, sans-serif;
  padding-top: 20px;
}
</style>
