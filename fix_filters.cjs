const fs = require('fs');

let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

// Add states
code = code.replace(
  "const [includedClasses, setIncludedClasses] = useState<Set<string>>(new Set());",
  "const [includedClasses, setIncludedClasses] = useState<Set<string>>(new Set());\n  const [filterDate, setFilterDate] = useState<string>('');\n  const [filterResponsibleOnly, setFilterResponsibleOnly] = useState<boolean>(false);"
);

// Get available dates
code = code.replace(
  "const classes = useMemo(() => {",
  "const availableDates = useMemo(() => {\n    const dates = new Set(monitorEnvelopes.map(s => s.date));\n    return Array.from(dates).sort();\n  }, [monitorEnvelopes]);\n\n  const filteredEnvelopes = useMemo(() => {\n    return monitorEnvelopes.filter(s => {\n      if (filterDate && s.date !== filterDate) return false;\n      if (filterResponsibleOnly && !s.isResponsible) return false;\n      return true;\n    });\n  }, [monitorEnvelopes, filterDate, filterResponsibleOnly]);\n\n  const classes = useMemo(() => {"
);

// Replace mapping monitorEnvelopes.map to filteredEnvelopes.map in JSX
// But first need to verify the variable names. Let's do it carefully.
