const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "tab: (params.get('tab') as 'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'settings' | 'monitors_list' | 'course_compare') || 'personal_schedule',",
  "tab: (params.get('tab') as 'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'envelope_all' | 'settings' | 'monitors_list' | 'course_compare') || 'personal_schedule',"
);

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'settings' | 'monitors_list' | 'course_compare'>(initialState.tab as any);",
  "const [activeTab, setActiveTab] = useState<'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'envelope_all' | 'settings' | 'monitors_list' | 'course_compare'>(initialState.tab as any);"
);

fs.writeFileSync('src/App.tsx', code);
