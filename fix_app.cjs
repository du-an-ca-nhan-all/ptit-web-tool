const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "import { ExamRecord, LoginUser } from './types';",
  "import { ExamRecord, LoginUser, ExamSession } from './types';\nimport { buildSessions } from './utils/dataModel';"
);

app = app.replace(
  "const [records, setRecords] = useState<ExamRecord[]>([]);",
  "const [records, setRecords] = useState<ExamRecord[]>([]);\n  const [sessions, setSessions] = useState<ExamSession[]>([]);"
);

app = app.replace(
  "setRecords(cleanedData);",
  "setRecords(cleanedData);\n          setSessions(buildSessions(cleanedData));"
);

app = app.replace(
  "setRecords([]);",
  "setRecords([]);\n    setSessions([]);"
);

// Update props for the 3 components
app = app.replace(
  /<RoomEnvelopeManager\n\s*records=\{records\}\n\s*loginUsers=\{loginUsers\}/g,
  "<RoomEnvelopeManager\n              records={records}\n              sessions={sessions}\n              loginUsers={loginUsers}"
);

app = app.replace(
  /<AllMonitorsEnvelopes\n\s*records=\{records\}\n\s*loginUsers=\{loginUsers\}/g,
  "<AllMonitorsEnvelopes\n              records={records}\n              sessions={sessions}\n              loginUsers={loginUsers}"
);

app = app.replace(
  /<SettlementManager\n\s*records=\{records\}\n\s*loginUsers=\{loginUsers\}/g,
  "<SettlementManager\n              records={records}\n              sessions={sessions}\n              loginUsers={loginUsers}"
);

fs.writeFileSync('src/App.tsx', app);
