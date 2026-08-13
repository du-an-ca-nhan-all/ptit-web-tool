const fs = require('fs');

let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "const classCounts = session.classCounts;",
  "const classCounts = Array.from(session.counts.entries()).map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count);"
);

code = code.replace(
  "const responsibleCount = sessions.filter(s => s.isResponsible).length;",
  "const responsibleCount = monitorEnvelopes.filter(s => s.isResponsible).length;"
);

code = code.replace(
  "const totalExpectedMoney = sessions.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);",
  "const totalExpectedMoney = monitorEnvelopes.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);"
);

// We should also replace the useMemo dependencies for monitorEnvelopes to remove sessions if it is not used in the function anymore.
// actually let's just write it.

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
