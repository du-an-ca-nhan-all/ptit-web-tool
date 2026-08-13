const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "}, [classes, selectedClass, onClassChange]);",
  "}, [classes, selectedClass, onClassChange, hideClassSelector]);"
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
