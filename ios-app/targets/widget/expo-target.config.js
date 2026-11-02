/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "VarmintRidgeWidgets",
  displayName: "Varmint Ridge",
  icon: "../../assets/icon.png",
  deploymentTarget: "17.0",
  colors: {
    $widgetBackground: { light: "#F3E6C4", dark: "#1A1A1A" },
    $accent: "#C19A50",
    pine: "#305032",
    gold: "#C19A50",
    cream: "#F3E6C4",
    ink: "#1A1A1A",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.jwmanor.varmintridge"],
  },
};
