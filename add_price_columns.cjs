const fs = require('fs');

function updateTable(file, colSpanMatch, colSpanNew) {
  let code = fs.readFileSync(file, 'utf8');

  // Add TH
  code = code.replace(
    /<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên<\/th>/g,
    '<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>\n                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Bồi dưỡng</th>'
  );

  // Update colspan
  code = code.replace(colSpanMatch, colSpanNew);

  // Add TD (for RoomEnvelopeManager, session is session. For AllMonitors, it's also session)
  // Let's replace the TD for "Cơ cấu sinh viên"
  code = code.replace(
    /<\/div>\s*<\/td>\s*<td className="px-6 py-4(?: text-right)?">/g,
    '</div>\n                    </td>\n                    <td className="px-6 py-4">\n                      <span className="inline-block bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded text-xs border border-amber-200">{formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat))}</span>\n                    </td>\n                    <td className="px-6 py-4${1 || \'\'}">'
  );
  
  // Wait, the regex might be tricky. Let's do it more precisely.
  fs.writeFileSync(file, code);
}

// RoomEnvelopeManager
let rCode = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');
rCode = rCode.replace(
  '<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>',
  '<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>\n                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">Bồi dưỡng</th>'
);
rCode = rCode.replace('<td colSpan={5}', '<td colSpan={6}');

rCode = rCode.replace(
  `                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">`,
  `                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200 whitespace-nowrap">
                        {formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">`
);
fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', rCode);

// AllMonitorsEnvelopes
let aCode = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');
aCode = aCode.replace(
  '<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>',
  '<th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>\n                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">Bồi dưỡng</th>'
);
aCode = aCode.replace('<td colSpan={5}', '<td colSpan={6}');

aCode = aCode.replace(
  `                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">`,
  `                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200 whitespace-nowrap">
                        {formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">`
);
fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', aCode);

