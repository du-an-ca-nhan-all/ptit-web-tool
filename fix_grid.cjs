const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">'
);
fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
