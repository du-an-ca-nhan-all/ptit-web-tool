const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  '<h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">\n            <Mail className="w-6 h-6 text-blue-600" />\n            Phân Công Phong Bì\n          </h2>',
  '<h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">\n            <Mail className="w-6 h-6 text-blue-600" />\n            {hideClassSelector ? "Phân Công Phong Bì Lớp Mình" : "Phân Công Phong Bì"}\n          </h2>'
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
