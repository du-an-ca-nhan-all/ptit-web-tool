const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const navCode = `
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 scrollbar-hide">
          <button 
            onClick={() => handleTabChange('schedule')}
            className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'schedule' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
          >
            <CalendarDays className="w-4 h-4" /> Lịch Thi Tổng Hợp
          </button>
          {currentUser && (
            <button 
              onClick={() => handleTabChange('personal_schedule')}
              className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'personal_schedule' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
            >
              <User className="w-4 h-4" /> Lịch Thi Cá Nhân
            </button>
          )}
          {currentUser && showCourseCompare && (
             <button 
             onClick={() => handleTabChange('course_compare')}
             className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'course_compare' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
           >
             <ArrowLeftRight className="w-4 h-4" /> So Sánh ĐKMH
           </button>
          )}

          <button 
            onClick={() => handleTabChange('monitors_list')}
            className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors mt-2 \${activeTab === 'monitors_list' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
          >
            <Crown className="w-4 h-4" /> Danh Sách Lớp Trưởng
          </button>

          {isMonitor && (
            <div className="mt-4 flex flex-col gap-1">
              <div 
                className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between cursor-pointer hover:text-slate-300"
                onClick={() => setIsClassGroupOpen(!isClassGroupOpen)}
              >
                Công cụ lớp trưởng
                <ChevronDown className={\`w-4 h-4 transition-transform \${isClassGroupOpen ? 'rotate-180' : ''}\`} />
              </div>
              {isClassGroupOpen && (
                <div className="pl-2 flex flex-col gap-1 mt-1 border-l-2 border-slate-800 ml-5">
                  <button 
                    onClick={() => handleTabChange('members')}
                    className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'members' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
                  >
                    <Users className="w-4 h-4" /> Danh Sách Lớp
                  </button>
                  <button 
                    onClick={() => handleTabChange('envelope')}
                    className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'envelope' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
                  >
                    <Mail className="w-4 h-4" /> PB Lớp Mình
                  </button>
                  <button 
                    onClick={() => handleTabChange('envelope_all')}
                    className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'envelope_all' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
                  >
                    <BookOpen className="w-4 h-4" /> PB Lớp Khác
                  </button>
                  <button 
                    onClick={() => handleTabChange('settlement')}
                    className={\`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors \${activeTab === 'settlement' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}\`}
                  >
                    <DollarSign className="w-4 h-4" /> Bù Trừ Thanh Toán
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
`;

code = code.replace(
  /<h1 className="text-white font-semibold text-lg tracking-tight">S-Exam Portal<\/h1>\n          <\/div>[\s\S]*?<\/nav>/,
  `<h1 className="text-white font-semibold text-lg tracking-tight">S-Exam Portal</h1>\n          </div>\n${navCode}`
);

fs.writeFileSync('src/App.tsx', code);
