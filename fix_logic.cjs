const fs = require('fs');

// Fix SettlementManager.tsx
let sm = fs.readFileSync('src/components/SettlementManager.tsx', 'utf8');
sm = sm.replace(
/    Array\.from\(sessionMap\.values\(\)\)\.forEach\(session => \{\n      const allClassCounts = Array\.from\(session\.counts\.entries\(\)\)\n        \.map\(\(\[className, count\]\) => \(\{ className, count \}\)\)\n        \.sort\(\(a, b\) => \{\n          if \(b\.count !== a\.count\) return b\.count - a\.count;\n          return a\.className\.localeCompare\(b\.className\);\n        \}\);\n\n      const responsibleClass = allClassCounts\[0\]\?\.className;\n\n      if \(\!responsibleClass \|\| \!monitorClasses\.has\(responsibleClass\)\) return; \/\/ Không có lớp trưởng nào phụ trách phòng này\n\n      const monitoredClassesInRoom = allClassCounts\.filter\(c => monitorClasses\.has\(c\.className\)\);\n      if \(monitoredClassesInRoom\.length <= 1\) return; \/\/ Chỉ có 1 lớp trưởng, không cần bù trừ\n\n      const totalMonitoredStudents = monitoredClassesInRoom\.reduce\(\(acc, c\) => acc \+ c\.count, 0\);/g,
`    Array.from(sessionMap.values()).forEach(session => {
      const allClassCounts = Array.from(session.counts.entries())
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.className.localeCompare(b.className);
        });

      const monitoredClassesInRoom = allClassCounts.filter(c => monitorClasses.has(c.className));
      if (monitoredClassesInRoom.length <= 1) return; // Không có hoặc chỉ có 1 lớp trưởng, không cần bù trừ chéo

      const responsibleClass = monitoredClassesInRoom[0].className;

      const totalMonitoredStudents = monitoredClassesInRoom.reduce((acc, c) => acc + c.count, 0);`
);
fs.writeFileSync('src/components/SettlementManager.tsx', sm);

// Fix RoomEnvelopeManager.tsx
let rm = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');
rm = rm.replace(
/      const classCounts = Array\.from\(session\.counts\.entries\(\)\)\n        \.map\(\(\[className, count\]\) => \(\{ className, count \}\)\)\n        \.sort\(\(a, b\) => \{\n          if \(b\.count !== a\.count\) return b\.count - a\.count;\n          return a\.className\.localeCompare\(b\.className\);\n        \}\);\n\n      const responsibleClass = classCounts\[0\]\?\.className;\n      const isResponsible = selectedClass === responsibleClass && classCounts\[0\]\?\.count > 0;/g,
`      const classCounts = Array.from(session.counts.entries())
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.className.localeCompare(b.className);
        });

      const monitoredClassCounts = classCounts.filter(c => monitorClasses.has(c.className));
      const responsibleClass = monitoredClassCounts[0]?.className;
      const isResponsible = selectedClass === responsibleClass && monitoredClassCounts[0]?.count > 0;`
);
fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', rm);

// Fix AllMonitorsEnvelopes.tsx
let am = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');
am = am.replace(
/      const classCounts = Array\.from\(session\.counts\.entries\(\)\)\n        \.map\(\(\[className, count\]\) => \(\{ className, count \}\)\)\n        \.sort\(\(a, b\) => \{\n          if \(b\.count !== a\.count\) return b\.count - a\.count;\n          return a\.className\.localeCompare\(b\.className\);\n        \}\);\n\n      const maxCount = classCounts\[0\]\?\.count \|\| 0;\n      const responsibleClasses = classCounts\.length > 0 \? \[classCounts\[0\]\.className\] : \[\];/g,
`      const classCounts = Array.from(session.counts.entries())
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.className.localeCompare(b.className);
        });

      const monitoredClassCounts = classCounts.filter(c => monitorClasses.has(c.className));
      const responsibleClasses = monitoredClassCounts.length > 0 ? [monitoredClassCounts[0].className] : [];`
);
fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', am);
