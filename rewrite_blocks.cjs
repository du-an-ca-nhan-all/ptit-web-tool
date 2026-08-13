const fs = require('fs');

// RoomEnvelopeManager
let rm = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');
rm = rm.replace(
/  const monitorClasses = useMemo[\s\S]*?    return classSessions;\n  \}, \[sessions, selectedClass, monitorClasses\]\);/g,
`  const monitorClasses = useMemo<Set<string>>(() => {
    return new Set(loginUsers.filter(u => u.role === 'lop_truong' && u.lop).map(u => u.lop as string));
  }, [loginUsers]);

  const monitorEnvelopes = useMemo(() => {
    if (!selectedClass || sessions.length === 0) return [];

    const classSessions: any[] = [];
    sessions.forEach(session => {
      const classCounts = session.classCounts;

      const monitoredClassCounts = classCounts.filter(c => monitorClasses.has(c.className));
      const responsibleClass = monitoredClassCounts[0]?.className;
      const isResponsible = selectedClass === responsibleClass && monitoredClassCounts[0]?.count > 0;

      if (classCounts.some(c => c.className === selectedClass && c.count > 0)) {
        classSessions.push({
          id: session.id,
          room: session.room,
          date: session.date,
          time: session.time,
          subject: session.subject,
          subjectCode: session.subjectCode,
          examFormat: session.examFormat,
          classCounts,
          isResponsible
        });
      }
    });

    return classSessions;
  }, [sessions, selectedClass, monitorClasses]);`
);
// Make sure to replace records dependency inside classes useMemo if needed. Actually classes useMemo is fine using records.
fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', rm);

// AllMonitorsEnvelopes
let am = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');
am = am.replace(
/  const sessions = useMemo[\s\S]*?    return Array\.from\(classEnvelopeMap\.values\(\)\)\.sort\(\(a, b\) => a\.className\.localeCompare\(b\.className\)\);\n  \}, \[sessions, monitorClasses\]\);/g,
`  const envelopesData = useMemo(() => {
    if (sessions.length === 0) return [];

    const classEnvelopeMap = new Map<string, any>();

    sessions.forEach(session => {
      const classCounts = session.classCounts;
      const monitoredClassCounts = classCounts.filter(c => monitorClasses.has(c.className));
      const responsibleClasses = monitoredClassCounts.length > 0 ? [monitoredClassCounts[0].className] : [];

      responsibleClasses.forEach(responsibleClass => {
        if (!classEnvelopeMap.has(responsibleClass)) {
          classEnvelopeMap.set(responsibleClass, {
            className: responsibleClass,
            sessions: []
          });
        }
        
        classEnvelopeMap.get(responsibleClass).sessions.push({
          id: session.id,
          room: session.room,
          date: session.date,
          time: session.time,
          subject: session.subject,
          subjectCode: session.subjectCode,
          examFormat: session.examFormat,
          classCounts
        });
      });
    });

    return Array.from(classEnvelopeMap.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [sessions, monitorClasses]);`
);

// fix variable name collision in AllMonitorsEnvelopes (sessions -> envelopesData)
am = am.replace(/sessions\.filter\(cls/g, "envelopesData.filter(cls");
am = am.replace(/sessions\.map\(cls/g, "filteredClasses.map(cls");
am = am.replace(/const filteredClasses = envelopesData\.filter/g, "const filteredClasses = envelopesData.filter");

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', am);
