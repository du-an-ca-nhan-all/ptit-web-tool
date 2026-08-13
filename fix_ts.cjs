const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

code = code.replace(
  "const monitorClasses = useMemo(() => {",
  "const monitorClasses = useMemo<Set<string>>(() => {"
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
