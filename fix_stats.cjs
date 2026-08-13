const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "const responsibleCount = monitorEnvelopes.filter(s => s.isResponsible).length;",
  "const responsibleCount = filteredEnvelopes.filter(s => s.isResponsible).length;"
);

code = code.replace(
  "const totalExpectedMoney = monitorEnvelopes.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);",
  "const totalExpectedMoney = filteredEnvelopes.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);"
);

code = code.replace(
  "<p className=\"text-3xl font-bold text-blue-900\">{monitorEnvelopes.length}</p>",
  "<p className=\"text-3xl font-bold text-blue-900\">{filteredEnvelopes.length}</p>"
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
