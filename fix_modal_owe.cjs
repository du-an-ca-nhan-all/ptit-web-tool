const fs = require('fs');
let code = fs.readFileSync('src/components/SettlementManager.tsx', 'utf8');

code = code.replace(
  /<tr key=\{idx\} className="hover:bg-slate-50">/g,
  `<tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setSelectedDetail(d)}>`
);

fs.writeFileSync('src/components/SettlementManager.tsx', code);
