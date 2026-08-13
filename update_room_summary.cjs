const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
`  const responsibleCount = sessions.filter(s => s.isResponsible).length;`,
`  const responsibleCount = sessions.filter(s => s.isResponsible).length;
  const totalExpectedMoney = sessions.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);`
);

code = code.replace(
`        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">Số phòng lớp mình phụ trách</p>
            <p className="text-3xl font-bold text-emerald-900">{responsibleCount}</p>
          </div>
        </div>
      </div>`,
`        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">Số phòng lớp phụ trách</p>
            <p className="text-3xl font-bold text-emerald-900">{responsibleCount}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Dự kiến bồi dưỡng</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>`
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
