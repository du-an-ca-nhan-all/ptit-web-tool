const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "if (classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {",
  "if (!hideClassSelector && classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {"
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
