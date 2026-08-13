const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "const sessions = useMemo(() => {",
  "const monitorEnvelopes = useMemo(() => {"
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
