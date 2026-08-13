const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

code = code.replace(
  "const monitorClassList: string[] = Array.from(monitorClasses).sort();",
  "const monitorClassList: string[] = Array.from(monitorClasses).map(String).sort();"
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
