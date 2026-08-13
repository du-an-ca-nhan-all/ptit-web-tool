const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Import SettlementManager
code = code.replace(
  "import CourseCompare from './components/CourseCompare';",
  "import CourseCompare from './components/CourseCompare';\nimport SettlementManager from './components/SettlementManager';"
);

// Update tab types
code = code.replace(
  /tab: \(params.get\('tab'\) as 'schedule' \| 'personal_schedule' \| 'monitor' \| 'members' \| 'envelope' \| 'envelope_all' \| 'settings' \| 'monitors_list' \| 'course_compare'\) \|\| 'personal_schedule'/g,
  "tab: (params.get('tab') as 'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'envelope_all' | 'settlement' | 'settings' | 'monitors_list' | 'course_compare') || 'personal_schedule'"
);

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<'schedule' \| 'personal_schedule' \| 'monitor' \| 'members' \| 'envelope' \| 'envelope_all' \| 'settings' \| 'monitors_list' \| 'course_compare'>/g,
  "const [activeTab, setActiveTab] = useState<'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'envelope_all' | 'settlement' | 'settings' | 'monitors_list' | 'course_compare'>"
);

// Update restrict tabs hook
code = code.replace(
  /if \(\!isMonitor && \['monitor', 'envelope', 'envelope_all', 'settings'\]\.includes\(activeTab\)\) \{/,
  "if (!isMonitor && ['monitor', 'envelope', 'envelope_all', 'settlement', 'settings'].includes(activeTab)) {"
);

// Add Icon
code = code.replace(
  "import { Search, Calendar, ChevronLeft, CalendarDays, MapPin, Users, Info, Menu, X, ArrowLeft, Download, Shield, Settings, ShieldAlert, MonitorPlay, List, Mail, Wrench, FileCheck, Layers } from 'lucide-react';",
  "import { Search, Calendar, ChevronLeft, CalendarDays, MapPin, Users, Info, Menu, X, ArrowLeft, Download, Shield, Settings, ShieldAlert, MonitorPlay, List, Mail, Wrench, FileCheck, Layers, DollarSign } from 'lucide-react';"
);

// Add Tab Button
const newTabBtn = `                  <button 
                    onClick={() => handleTabChange('settlement')}
                    className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'settlement' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
                  >
                    <DollarSign className="w-4 h-4" /> Bù Trừ Thanh Toán
                  </button>
                  <button 
                    onClick={() => handleTabChange('settings')}`;
                    
code = code.replace(
  /                  <button \n                    onClick=\{\(\) => handleTabChange\('settings'\)\}/,
  newTabBtn
);

// Add Title in Topbar
code = code.replace(
  /activeTab === 'envelope_all' \? 'Phân Công Phong Bì Lớp Trưởng' : activeTab === 'settings' \? 'Cài Đặt' : 'Công Cụ Lớp Trưởng'/,
  "activeTab === 'envelope_all' ? 'Phân Công Phong Bì Lớp Trưởng' : activeTab === 'settlement' ? 'Bù Trừ Thanh Toán' : activeTab === 'settings' ? 'Cài Đặt' : 'Công Cụ Lớp Trưởng'"
);

// Add Component Render
const renderBlock = `          ) : activeTab === 'envelope_all' ? (
            <AllMonitorsEnvelopes
              records={records}
              loginUsers={loginUsers}
            />
          ) : activeTab === 'settlement' ? (
            <SettlementManager
              records={records}
              loginUsers={loginUsers}
            />
          ) : activeTab === 'settings' ? (`;

code = code.replace(
  /          \) : activeTab === 'envelope_all' \? \(\n            <AllMonitorsEnvelopes\n              records=\{records\}\n              loginUsers=\{loginUsers\}\n            \/>\n          \) : activeTab === 'settings' \? \(/,
  renderBlock
);

fs.writeFileSync('src/App.tsx', code);
