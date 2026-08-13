const fs = require('fs');

let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

// Add Download to imports
code = code.replace(
  "import { Mail, MapPin, Users, Info, Calculator, X, DollarSign } from 'lucide-react';",
  "import { Mail, MapPin, Users, Info, Calculator, X, DollarSign, Download } from 'lucide-react';"
);

const exportFunc = `
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Ngày thi',
      'Giờ thi',
      'Phòng thi',
      'Môn thi',
      'Mã MH',
      'Cơ cấu sinh viên',
      'Bồi dưỡng dự kiến (VNĐ)',
      'Trách nhiệm lấy PB'
    ];
    
    const rows = filteredEnvelopes.map((session, index) => {
      const studentStructure = session.classCounts.map(c => \`\${c.className} (\${c.count})\`).join(', ');
      const money = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
      const isResponsibleStr = session.isResponsible ? 'Lớp mình' : \`\${session.classCounts[0]?.className || ''} (\${session.classCounts[0]?.count || 0} SV)\`;
      return [
        index + 1,
        session.date,
        session.time,
        session.room,
        \`"\${session.subject}"\`,
        session.subjectCode,
        \`"\${studentStructure}"\`,
        money,
        \`"\${isResponsibleStr}"\`
      ].join(',');
    });
    
    const csvContent = '\\uFEFF' + headers.join(',') + '\\n' + rows.join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`Phan_Cong_Phong_Bi_\${selectedClass || 'Tat_Ca'}.csv\`;
    link.click();
    URL.revokeObjectURL(url);
  };
`;

code = code.replace(
  "const handleOpenSplit = (session: SessionEnvelope) => {",
  exportFunc + "\n  const handleOpenSplit = (session: SessionEnvelope) => {"
);

const exportBtn = `
        <button 
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700 w-full md:w-auto justify-center"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
`;

code = code.replace(
  "Chỉ hiện các phòng lớp mình đi lấy PB\n          </label>\n        </div>",
  "Chỉ hiện các phòng lớp mình đi lấy PB\n          </label>\n        </div>\n" + exportBtn
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
