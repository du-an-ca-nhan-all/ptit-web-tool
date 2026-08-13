const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

code = code.replace(
`  const displayedSessions = sessions.filter(session => {`,
`  const totalExpectedMoney = sessions.reduce((acc, s) => {
    // Only count money if a monitor class is responsible for it
    const hasMonitorResponsible = s.responsibleClasses.some(cls => monitorClasses.has(cls));
    if (hasMonitorResponsible) {
      return acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat);
    }
    return acc;
  }, 0);

  const displayedSessions = sessions.filter(session => {`
);

code = code.replace(
`      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tổng số phòng thi liên quan</p>
            <p className="text-3xl font-bold text-slate-800">{displayedSessions.length}</p>
          </div>
        </div>
      </div>`,
`      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tổng số phòng thi liên quan</p>
            <p className="text-3xl font-bold text-slate-800">{displayedSessions.length}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Tổng quỹ dự kiến (tất cả lớp trưởng)</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>`
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
