const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove defaultClass state and related logic
code = code.replace(
  "const [defaultClass, setDefaultClass] = useState<string>(() => localStorage.getItem('defaultClass') || '');\n",
  ""
);

code = code.replace(
  "const [monitorClass, setMonitorClass] = useState<string>(initialState.monitorClass || defaultClass);",
  "const [monitorClass, setMonitorClass] = useState<string>(initialState.monitorClass || (() => {\n    const saved = localStorage.getItem('currentUser');\n    const user = saved ? JSON.parse(saved) : null;\n    return user?.lop || '';\n  })());"
);

code = code.replace(
  "const handleDefaultClassChange = (cls: string) => {\n    setDefaultClass(cls);\n    localStorage.setItem('defaultClass', cls);\n    setMonitorClass(cls);\n  };\n",
  ""
);

// Remove the settings button from sidebar
const settingsBtnRegex = /<button[\s\S]*?onClick=\{\(\) => handleTabChange\('settings'\)\}[\s\S]*?Cài Đặt\n\s*<\/button>/;
code = code.replace(settingsBtnRegex, "");

// Remove the settings panel from main render
const settingsPanelRegex = /          \) : activeTab === 'settings' \? \(\n            <SettingsPanel\n              records=\{records\}\n              defaultClass=\{defaultClass\}\n              onDefaultClassChange=\{handleDefaultClassChange\}\n            \/>\n/g;
code = code.replace(settingsPanelRegex, "");

// Remove settings from activeTab text
code = code.replace(
  " activeTab === 'settings' ? 'Cài Đặt' :",
  ""
);

// We should also remove the SettingsPanel import
code = code.replace(
  "import SettingsPanel from './components/SettingsPanel';\n",
  ""
);

fs.writeFileSync('src/App.tsx', code);
