const fs = require('fs');
let code = fs.readFileSync('src/components/SettlementManager.tsx', 'utf8');

code = code.replace(/\\\$\\{/g, '${');
code = code.replace(/\\\`/g, '`');

fs.writeFileSync('src/components/SettlementManager.tsx', code);
