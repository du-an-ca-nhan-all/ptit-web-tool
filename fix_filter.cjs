const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

code = code.replace(
`  const filteredMonitors = monitorClassList.filter((cls: string) => 
    cls.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loginUsers.find(u => u.lop === cls)?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );`,
`  const filteredMonitors = monitorClassList.filter((cls: string) => {
    const term = searchTerm.toLowerCase();
    const classMatch = String(cls).toLowerCase().includes(term);
    const user = loginUsers.find(u => u.lop === cls);
    const nameMatch = user && user.fullName ? String(user.fullName).toLowerCase().includes(term) : false;
    return classMatch || nameMatch;
  });`
);

code = code.replace(
  '<span className="text-slate-700 font-medium text-sm mt-0.5" title={env.subject}>{env.subject}</span>',
  '<span className="text-slate-700 font-medium text-sm mt-0.5 break-words whitespace-normal" title={env.subject}>{env.subject}</span>'
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
