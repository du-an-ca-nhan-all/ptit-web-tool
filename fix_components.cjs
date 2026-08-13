const fs = require('fs');

function updateComponent(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  code = code.replace(
    "import { ExamRecord, LoginUser } from '../types';",
    "import { ExamRecord, LoginUser, ExamSession } from '../types';"
  );

  code = code.replace(
    /interface .*?Props {/,
    match => match + "\n  sessions: ExamSession[];"
  );
  
  // Replace the component signature
  code = code.replace(
    /export default function (\w+)\(\{ records, loginUsers = \[\] \}: (.*?)Props\) \{/,
    "export default function $1({ records, sessions = [], loginUsers = [] }: $2Props) {"
  );

  // Replace sessionMap logic with sessions.filter or direct mapping
  // In RoomEnvelopeManager:
  if (filePath.includes('RoomEnvelopeManager')) {
    code = code.replace(
      /    const sessionKeys = new Set\([\s\S]*?      session\.counts\.set\(className, \(session\.counts\.get\(className\) \|\| 0\) \+ 1\);\n    \}\);\n\n    const classSessions: any\[\] = \[\];\n\n    Array\.from\(sessionMap\.values\(\)\)\.forEach\(session => \{/g,
      `    const classSessions: any[] = [];
    sessions.forEach(session => {`
    );
    // Replace classCounts
    code = code.replace(
      /      const classCounts = Array\.from\(session\.counts\.entries\(\)\)[\s\S]*?          return a\.className\.localeCompare\(b\.className\);\n        \}\);/g,
      `      const classCounts = session.classCounts;`
    );
  }

  if (filePath.includes('AllMonitorsEnvelopes')) {
    code = code.replace(
      /    const sessionKeys = new Set\([\s\S]*?      session\.counts\.set\(className, \(session\.counts\.get\(className\) \|\| 0\) \+ 1\);\n    \}\);\n\n    const classEnvelopeMap = new Map<string, any>\(\);\n\n    Array\.from\(sessionMap\.values\(\)\)\.forEach\(session => \{/g,
      `    const classEnvelopeMap = new Map<string, any>();
    sessions.forEach(session => {`
    );
    // Replace classCounts
    code = code.replace(
      /      const classCounts = Array\.from\(session\.counts\.entries\(\)\)[\s\S]*?          return a\.className\.localeCompare\(b\.className\);\n        \}\);/g,
      `      const classCounts = session.classCounts;`
    );
  }

  // Common cleanup:
  // "if (!selectedClass || records.length === 0)" -> "... || sessions.length === 0)"
  code = code.replace(/records\.length === 0/g, "sessions.length === 0");

  fs.writeFileSync(filePath, code);
}

updateComponent('src/components/RoomEnvelopeManager.tsx');
updateComponent('src/components/AllMonitorsEnvelopes.tsx');
