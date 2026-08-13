const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  '<span className="text-slate-700 font-medium text-sm mt-0.5" title={session.subject}>{session.subject}</span>',
  '<span className="text-slate-700 font-medium text-sm mt-0.5 break-words whitespace-normal" title={session.subject}>{session.subject}</span>'
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
