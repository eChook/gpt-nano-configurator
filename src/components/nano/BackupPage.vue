<template>
  <div>
    <h1 class="page-title">Backup &amp; Reset</h1>
    <p class="page-subtitle">Save or restore a full settings file, or revert this board to the factory defaults.</p>

    <Panel title="Backup configuration">
      <p class="panel-copy">Downloads every calibration value and setting currently loaded below as a single .ecb file.</p>
      <DsButton variant="secondary" @click="$emit('backup')">
        <span class="btn-inline"><Download :size="16" />Download backup</span>
      </DsButton>
    </Panel>

    <Panel title="Restore from backup">
      <p class="panel-copy">Loads values from a .ecb file into the fields below. You'll still need to send changes to write them to the board.</p>
      <input id="nano-restore-input" type="file" accept=".ecb,.json" style="display:none" @change="$emit('restore-file', $event)" />
      <DsButton variant="secondary" @click="triggerFile">
        <span class="btn-inline"><Upload :size="16" />Choose backup file</span>
      </DsButton>
    </Panel>

    <div class="danger-box">
      <h2 class="danger-title">Reset to factory defaults</h2>
      <p class="panel-copy">Clears the EEPROM and reverts every calibration value and setting. Unplug and reconnect the board afterwards.</p>
      <DsButton variant="destructive" @click="$emit('reset')">
        <span class="btn-inline"><Trash :size="16" />Reset eChook</span>
      </DsButton>
    </div>
  </div>
</template>

<script>
import DsButton from "../ds/Button.vue";
import Panel from "./Panel.vue";
import { Download, Upload, Trash } from "../icons/nanoIcons";

export default {
  name: "BackupPage",
  components: { DsButton, Panel, Download, Upload, Trash },
  emits: ["backup", "restore-file", "reset"],
  methods: {
    triggerFile() {
      document.getElementById("nano-restore-input").click();
    },
  },
};
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--app-text);
}
.page-subtitle {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0 0 20px;
}
.panel-copy {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0 0 14px;
  line-height: 1.5;
}
.btn-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.danger-box {
  border: 1px solid rgba(239, 68, 68, .4);
  background: rgba(127, 29, 29, .08);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.danger-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--app-text);
}
</style>
