const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "<Mail className=\"w-4 h-4\" /> Phân Công Phong Bì",
  "<Mail className=\"w-4 h-4\" /> Phân Công PB Lớp Mình\n                  </button>\n                  <button \n                    onClick={() => handleTabChange('envelope_all')}\n                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'envelope_all' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}\n                  >\n                    <Mail className=\"w-4 h-4\" /> Phân Công PB Lớp Trưởng"
);

code = code.replace(
  "activeTab === 'envelope' ? 'Phân Công Phong Bì'",
  "activeTab === 'envelope' ? 'Phân Công Phong Bì Lớp Mình' : activeTab === 'envelope_all' ? 'Phân Công Phong Bì Lớp Trưởng'"
);

code = code.replace(
  "          ) : activeTab === 'envelope' ? (\n            <RoomEnvelopeManager\n              records={records}\n              selectedClass={monitorClass}\n              onClassChange={setMonitorClass}\n              loginUsers={loginUsers}\n            />",
  "          ) : activeTab === 'envelope' ? (\n            <RoomEnvelopeManager\n              records={records}\n              selectedClass={currentUser?.lop || monitorClass}\n              onClassChange={setMonitorClass}\n              loginUsers={loginUsers}\n              hideClassSelector={true}\n            />\n          ) : activeTab === 'envelope_all' ? (\n            <AllMonitorsEnvelopes\n              records={records}\n              loginUsers={loginUsers}\n            />"
);

code = code.replace(
  "import RoomEnvelopeManager from './components/RoomEnvelopeManager';",
  "import RoomEnvelopeManager from './components/RoomEnvelopeManager';\nimport AllMonitorsEnvelopes from './components/AllMonitorsEnvelopes';"
);

fs.writeFileSync('src/App.tsx', code);
