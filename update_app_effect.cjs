const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "if (!isMonitor && ['monitor', 'envelope', 'settings'].includes(activeTab)) {",
  "if (!isMonitor && ['monitor', 'envelope', 'envelope_all', 'settings'].includes(activeTab)) {"
);

fs.writeFileSync('src/App.tsx', code);
