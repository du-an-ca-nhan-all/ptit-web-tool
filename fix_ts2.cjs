const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

code = code.replace(
  "const monitorClassList = Array.from(monitorClasses).sort();",
  "const monitorClassList: string[] = Array.from(monitorClasses).sort();"
);

code = code.replace(
  "const filteredMonitors = monitorClassList.filter(cls => ",
  "const filteredMonitors = monitorClassList.filter((cls: string) => "
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
