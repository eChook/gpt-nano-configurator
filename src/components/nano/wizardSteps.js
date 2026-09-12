import { h } from "vue";
import DsInput from "../ds/Input.vue";
import DsButton from "../ds/Button.vue";
import SegmentedChoice from "../ds/SegmentedChoice.vue";
import DataTile from "../ds/DataTile.vue";
import ReviewRow from "./ReviewRow.vue";

const helperStyle = { fontSize: "13px", color: "var(--neutral-400)", lineHeight: "1.6", margin: "0 0 16px" };

function fmt(v, p) {
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toFixed(p == null ? 2 : p);
}

export function buildSetupSteps(ctx) {
  return [
    {
      title: "Welcome",
      render: () =>
        h("div", [
          h(
            "p",
            { style: helperStyle },
            "This wizard sets the essentials every eChook Nano needs before its first session: device name, throttle behaviour, and speed sensor calibration. You can change everything again later."
          ),
          h(DsInput, {
            label: "Board / Bluetooth Name",
            modelValue: ctx.name.value,
            "onUpdate:modelValue": (v) => ctx.setName(v),
            placeholder: "e.g. Kestrel-07",
          }),
        ]),
    },
    {
      title: "Throttle behaviour",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Choose how the throttle reports its position, then whether the PWM output and ramp limiter are active."),
          h(SegmentedChoice, {
            label: "Throttle Type",
            onLabel: "Variable",
            offLabel: "On / Off",
            checked: ctx.binary.value.variableThrottle,
            onChange: (v) => ctx.setBinary("variableThrottle", v),
          }),
          h(SegmentedChoice, {
            label: "Throttle Output (PWM)",
            onLabel: "On",
            offLabel: "Off",
            checked: ctx.binary.value.throttleOut,
            onChange: (v) => ctx.setBinary("throttleOut", v),
          }),
          h(SegmentedChoice, {
            label: "Throttle Ramp",
            onLabel: "On",
            offLabel: "Off",
            checked: ctx.binary.value.throttleRamp,
            onChange: (v) => ctx.setBinary("throttleRamp", v),
          }),
        ]),
    },
    {
      title: "Speed sensor",
      render: () =>
        h("div", [
          h(
            "p",
            { style: helperStyle },
            ctx.magnetsLocked.value
              ? "Measure the wheel's rolling circumference. Firmware 2.1+ requires exactly one magnet per sensor, so magnet counts are locked to 1."
              : "Measure the wheel's rolling circumference, and set how many magnets are fitted to the speed and RPM sensors."
          ),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" } }, [
            h(DsInput, {
              label: "Speed Magnets",
              type: "number",
              disabled: ctx.magnetsLocked.value,
              modelValue: ctx.speedMagnets.value,
              "onUpdate:modelValue": (v) => ctx.setSpeedMagnets(v),
            }),
            h(DsInput, {
              label: "RPM Magnets",
              type: "number",
              disabled: ctx.magnetsLocked.value,
              modelValue: ctx.rpmMagnets.value,
              "onUpdate:modelValue": (v) => ctx.setRpmMagnets(v),
            }),
          ]),
          h(DsInput, {
            label: "Wheel Circumference (m)",
            type: "number",
            step: "any",
            modelValue: ctx.circumference.value,
            "onUpdate:modelValue": (v) => ctx.setCircumference(v),
          }),
        ]),
    },
    {
      title: "Review",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Confirm these settings, then finish. You'll still need to send changes to write them to the board."),
          h(ReviewRow, { label: "Name", value: ctx.name.value }),
          h(ReviewRow, { label: "Throttle Type", value: ctx.binary.value.variableThrottle ? "Variable" : "On / Off" }),
          h(ReviewRow, { label: "Speed Magnets", value: ctx.speedMagnets.value }),
          h(ReviewRow, { label: "Circumference", value: ctx.circumference.value + " m" }),
        ]),
    },
  ];
}

export function buildSpeedWizardSteps(ctx) {
  return [
    {
      title: "Count the magnets",
      render: () =>
        h("div", [
          h(
            "p",
            { style: helperStyle },
            ctx.magnetsLocked.value
              ? "Firmware 2.1+ requires exactly one magnet per sensor - wheel and motor magnet counts are locked to 1."
              : "Count how many magnets are fitted to the wheel and motor pickup sensors."
          ),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } }, [
            h(DsInput, {
              label: "Speed Magnets",
              type: "number",
              disabled: ctx.magnetsLocked.value,
              modelValue: ctx.speedMagnets.value,
              "onUpdate:modelValue": (v) => ctx.setSpeedMagnets(v),
            }),
            h(DsInput, {
              label: "RPM Magnets",
              type: "number",
              disabled: ctx.magnetsLocked.value,
              modelValue: ctx.rpmMagnets.value,
              "onUpdate:modelValue": (v) => ctx.setRpmMagnets(v),
            }),
          ]),
        ]),
    },
    {
      title: "Measure the wheel",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Wrap a tape measure around the tyre's rolling circumference, in metres."),
          h(DsInput, {
            label: "Wheel Circumference (m)",
            type: "number",
            step: "any",
            modelValue: ctx.circumference.value,
            "onUpdate:modelValue": (v) => ctx.setCircumference(v),
          }),
        ]),
    },
    {
      title: "Spin test",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Spin the wheel by hand and check the live reading below looks sensible before finishing."),
          h("div", { style: { display: "flex", gap: "12px" } }, [
            h(DataTile, { label: "Speed", unit: "m/s", value: fmt(ctx.live.value.speed, 2) }),
            h(DataTile, { label: "Motor RPM", unit: "rpm", value: fmt(ctx.live.value.rpm, 0) }),
          ]),
        ]),
    },
  ];
}

export function buildFiveVoltWizardSteps(ctx) {
  function step(delta) {
    ctx.setMultimeterOffset(Math.round((ctx.multimeterOffset.value + delta) * 100) / 100);
  }
  const nudgeBtn = (label, delta) =>
    h(
      "span",
      {
        onClick: () => step(delta),
        style: {
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--neutral-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "700",
          color: "#fff",
          cursor: "pointer",
          userSelect: "none",
        },
      },
      label
    );
  return [
    {
      title: "Measure the 5V rail",
      render: () =>
        h("div", [
          h(
            "p",
            { style: helperStyle },
            "Measure the +5V test point on the board with a reliable multimeter, then nudge the value below to match — the reading may drift slightly, so keep an eye on the multimeter while you adjust."
          ),
          h("div", { style: { marginBottom: "14px" } }, [h(DataTile, { label: "Board's 5V Rail", unit: "V", value: fmt(ctx.live.value.fiveVoltRail, 2) })]),
          h(
            "div",
            {
              style: {
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "var(--neutral-400)",
                marginBottom: "8px",
                textAlign: "center",
              },
            },
            "Multimeter Reading (V)"
          ),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" } }, [
            nudgeBtn("−", -0.01),
            h("span", { style: { fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: "700", color: "#fff", minWidth: "80px", textAlign: "center" } }, fmt(ctx.multimeterReading.value, 2)),
            nudgeBtn("+", 0.01),
          ]),
        ]),
    },
    {
      title: "Confirm",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Applying this will adjust the board's internal reference so the 5V rail reading matches your multimeter."),
          h(ReviewRow, { label: "Old reading", value: fmt(ctx.live.value.fiveVoltRail, 2) + " V" }),
          h(ReviewRow, { label: "Offset", value: (ctx.multimeterOffset.value >= 0 ? "+" : "") + ctx.multimeterOffset.value.toFixed(2) + " V" }),
          h(ReviewRow, { label: "New reading", value: fmt(ctx.multimeterReading.value, 2) + " V" }),
        ]),
    },
  ];
}

export function buildVoltageWizardSteps(ctx, which) {
  const label = which === "total" ? "Voltage (Total)" : "Voltage (Lower)";
  const currentScale = which === "total" ? ctx.voltageScale.value : ctx.voltageLowerScale.value;
  const newScale = (Number(currentScale) * (5.0 / Number(ctx.live.value.fiveVoltRail || 5))).toFixed(2);
  return [
    {
      title: "Verify the 5V rail",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, "Check the reading below against a multimeter on the board's +5V test point before continuing."),
          h("div", { style: { marginBottom: "14px" } }, [h(DataTile, { label: "Board's 5V Rail", unit: "V", value: fmt(ctx.live.value.fiveVoltRail, 2) })]),
          h(
            "span",
            {
              onClick: ctx.exitToFiveVolt,
              style: { fontSize: "12px", color: "#f472a0", textDecoration: "underline", cursor: "pointer" },
            },
            "Doesn't match? Calibrate the 5V rail first"
          ),
        ]),
    },
    {
      title: "Connect the " + label + " input",
      nextLabel: "Calibrate",
      render: () =>
        h("div", [
          h(
            "p",
            { style: helperStyle },
            `Disconnect any 12V/24V sources, then use some wire to connect the ${label} input to the board's 5V output from any of the sensor connectors. This gives a known voltage on the input to calibrate against.`
          ),
          h("p", { style: helperStyle }, "Press Calibrate once connected."),
        ]),
    },
    {
      title: "Apply new scaling factor",
      render: () =>
        h("div", [
          h("p", { style: helperStyle }, `Reading the ${label} input against the 5V rail and calculating a matching scaling factor.`),
          h(ReviewRow, { label: "Current scaling factor", value: fmt(currentScale, 2) }),
          h(ReviewRow, { label: "New scaling factor", value: newScale }),
        ]),
    },
  ];
}
