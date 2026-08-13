const fs = require('fs');

let rm = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

// The memo variable is currently monitorEnvelopes (from my previous fix)
rm = rm.replace(/sessions\.length === 0 \? \(/g, "monitorEnvelopes.length === 0 ? (");
rm = rm.replace(/sessions\.map\(\(session, index\)/g, "monitorEnvelopes.map((session, index)");
rm = rm.replace(/text-blue-900\">\{sessions\.length\}/g, 'text-blue-900">{monitorEnvelopes.length}');

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', rm);
