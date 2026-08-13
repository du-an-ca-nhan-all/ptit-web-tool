const fs = require('fs');

let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

// The replacement above failed or placed it before monitorEnvelopes.
// Let's first make sure we have the states.
if (!code.includes('filterDate')) {
code = code.replace(
  "const [includedClasses, setIncludedClasses] = useState<Set<string>>(new Set());",
  "const [includedClasses, setIncludedClasses] = useState<Set<string>>(new Set());\n  const [filterDate, setFilterDate] = useState<string>('');\n  const [filterResponsibleOnly, setFilterResponsibleOnly] = useState<boolean>(false);"
);
}

// Add the filtered variables after monitorEnvelopes
code = code.replace(
  "const responsibleCount = monitorEnvelopes.filter(s => s.isResponsible).length;",
  "const availableDates = useMemo(() => {\n    const dates = new Set(monitorEnvelopes.map(s => s.date));\n    return Array.from(dates).sort();\n  }, [monitorEnvelopes]);\n\n  const filteredEnvelopes = useMemo(() => {\n    return monitorEnvelopes.filter(s => {\n      if (filterDate && s.date !== filterDate) return false;\n      if (filterResponsibleOnly && !s.isResponsible) return false;\n      return true;\n    });\n  }, [monitorEnvelopes, filterDate, filterResponsibleOnly]);\n\n  const responsibleCount = monitorEnvelopes.filter(s => s.isResponsible).length;"
);

// We need to replace monitorEnvelopes.length in the table with filteredEnvelopes.length if we are using them. Wait, the counts in the top row should probably still be based on monitorEnvelopes, or based on filtered? The user might want the stats to reflect the filtered view or the total view. Let's keep the stats as total, but use filtered for the table.
code = code.replace(
  "monitorEnvelopes.map((session, index)",
  "filteredEnvelopes.map((session, index)"
);

code = code.replace(
  "monitorEnvelopes.length === 0 ?",
  "filteredEnvelopes.length === 0 ?"
);

// We need to add the filter UI.
const filterUI = `
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[150px]"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">Tất cả các ngày</option>
            {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterResponsibleOnly}
              onChange={(e) => setFilterResponsibleOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
            />
            Chỉ hiện các phòng lớp mình đi lấy PB
          </label>
        </div>
      </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">/,
  filterUI + '\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">'
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
