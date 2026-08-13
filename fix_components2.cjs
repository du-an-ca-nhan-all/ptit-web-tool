const fs = require('fs');

function updateComp(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (filePath.includes('RoomEnvelopeManager')) {
     code = code.replace(
       "export default function RoomEnvelopeManager({ records, selectedClass, onClassChange, loginUsers = [], hideClassSelector = false }: RoomEnvelopeManagerProps) {",
       "export default function RoomEnvelopeManager({ sessions = [], records, selectedClass, onClassChange, loginUsers = [], hideClassSelector = false }: RoomEnvelopeManagerProps) {"
     );
     code = code.replace("  sessions: ExamSession[];", "");
     code = code.replace(
       "interface RoomEnvelopeManagerProps {",
       "interface RoomEnvelopeManagerProps {\n  sessions: ExamSession[];"
     );
  }
  fs.writeFileSync(filePath, code);
}
updateComp('src/components/RoomEnvelopeManager.tsx');
