import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, LogOut, LayoutDashboard, Calendar, Users, FileText, Search, Download, Wrench, ChevronDown, ChevronRight, GraduationCap, Mail, Settings, User, BookOpen, Menu, X } from 'lucide-react';
import Papa from 'papaparse';
import { parse as parseYaml } from 'yaml';
import UploadSection from './components/UploadSection';
import FilterBar, { FilterState } from './components/FilterBar';
import DataTable, { SortKey, SortDirection } from './components/DataTable';
import ClassMonitorTools from './components/ClassMonitorTools';
import ClassMembers from './components/ClassMembers';
import RoomEnvelopeManager from './components/RoomEnvelopeManager';
import SettingsPanel from './components/SettingsPanel';
import LoginScreen from './components/LoginScreen';
import ExamRoomMembers from './components/ExamRoomMembers';
import MonitorsList from './components/MonitorsList';
import CourseCompare from './components/CourseCompare';
import { ExamRecord, LoginUser } from './types';

const getInitialState = () => {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return {
    tab: (params.get('tab') as 'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'settings' | 'monitors_list' | 'course_compare') || 'personal_schedule',
    search: params.get('search') || '',

    classCode: params.get('classCode') || '',
    subjectCode: params.get('subjectCode') || '',
    date: params.get('date') || '',
    monitorClass: params.get('monitorClass') || '',
    sortKey: (params.get('sortKey') as SortKey) || 'DateTime',
    sortDir: (params.get('sortDir') as SortDirection) || 'asc',
  };
};

export default function App() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const initialState = useMemo(getInitialState, []);
  const [activeTab, setActiveTab] = useState<'schedule' | 'personal_schedule' | 'monitor' | 'members' | 'envelope' | 'settings' | 'monitors_list' | 'course_compare'>(initialState.tab as any);
  
  const [defaultClass, setDefaultClass] = useState<string>(() => localStorage.getItem('defaultClass') || '');
  const [monitorClass, setMonitorClass] = useState<string>(initialState.monitorClass || defaultClass);
  const [filters, setFilters] = useState<FilterState>({
    search: initialState.search,
    classCode: initialState.classCode,
    subjectCode: initialState.subjectCode,
    date: initialState.date,
  });
  const [searchInput, setSearchInput] = useState(initialState.search);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(
    { key: initialState.sortKey, direction: initialState.sortDir }
  );
  const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null);
  const [confirmClassCode, setConfirmClassCode] = useState<string | null>(null);
  const [selectedExamRoom, setSelectedExamRoom] = useState<ExamRecord | null>(null);
  const [isClassGroupOpen, setIsClassGroupOpen] = useState(
    initialState.tab === 'members' || initialState.tab === 'monitor' || initialState.tab === 'envelope'
  );

  const [loginUsers, setLoginUsers] = useState<LoginUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMonitor = currentUser?.role === 'lop_truong';

  const [courseCompareData, setCourseCompareData] = useState<{main: any, subAccount: any, allSubAccounts?: any[]} | null>(null);
  const [showCourseCompare, setShowCourseCompare] = useState(false);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isMonitor && ['monitor', 'envelope', 'settings'].includes(activeTab)) {
      setActiveTab('personal_schedule');
    }
  }, [isMonitor, activeTab]);

  useEffect(() => {
    setSelectedExamRoom(null);
  }, [activeTab]);

  useEffect(() => {
    let classCode = currentUser?.lop;
    
    if (!classCode && currentUser && records.length > 0) {
      const currentUsername = currentUser.username.toLowerCase();
      const studentRecord = records.find(r => r.MaSV?.toLowerCase() === currentUsername);
      if (studentRecord && studentRecord.MaLop) {
        classCode = studentRecord.MaLop;
      }
    }

    if (classCode && currentUser) {
      Promise.all([
        fetch(`/dangky_mon_hoc/${classCode}/main.json`).then(res => res.ok ? res.json() : null),
        fetch(`/dangky_mon_hoc/${classCode}/sub-accounts.json`).then(res => res.ok ? res.json() : null)
      ]).then(([mainData, subAccountsData]) => {
        if (mainData && subAccountsData) {
          const currentUsername = currentUser.username.toLowerCase();
          const subAcc = subAccountsData.find((acc: any) => acc.username.toLowerCase() === currentUsername);
          if (subAcc) {
            setCourseCompareData({ main: mainData, subAccount: subAcc, allSubAccounts: subAccountsData });
            setShowCourseCompare(true);
          } else {
            setShowCourseCompare(false);
            setCourseCompareData(null);
          }
        } else {
          setShowCourseCompare(false);
          setCourseCompareData(null);
        }
      }).catch(() => {
        setShowCourseCompare(false);
        setCourseCompareData(null);
      });
    } else {
      setShowCourseCompare(false);
      setCourseCompareData(null);
    }
  }, [currentUser, records]);

  useEffect(() => {
    Promise.all([
      fetch('/data.csv').then(res => res.ok ? res.text() : Promise.reject('CSV not found')),
      fetch('/class_config.yaml').then(res => res.ok ? res.text() : '').catch(() => ''), // Optional
      fetch('/login.yaml').then(res => res.ok ? res.text() : '').catch(() => '') // Optional
    ])
    .then(([csvText, yamlText, loginYaml]) => {
      if (loginYaml) {
        const loginConfig = parseYaml(loginYaml);
        if (loginConfig && loginConfig.users) {
          setLoginUsers(loginConfig.users);
        }
      }

      const config = yamlText ? parseYaml(yamlText) : { classes: [] };
      const includedMap = new Map<string, string>();
      const excludedSet = new Set<string>();

      if (config && config.classes) {
        config.classes.forEach((cls: any) => {
          if (cls.includedStudents) {
            cls.includedStudents.forEach((studentId: string) => {
              includedMap.set(studentId, cls.classCode);
            });
          }
          if (cls.excludedStudents) {
            cls.excludedStudents.forEach((studentId: string) => {
              excludedSet.add(studentId);
            });
          }
        });
      }

      Papa.parse<ExamRecord>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let cleanedData = results.data.filter(row => row.MaSV);
          
          // Lọc sinh viên không còn học/nghỉ học, map lại sinh viên ngoại lệ vào lớp tương ứng
          cleanedData = cleanedData
            .filter(row => !excludedSet.has(row.MaSV))
            .map(row => {
              if (includedMap.has(row.MaSV)) {
                return { ...row, MaLop: includedMap.get(row.MaSV)! };
              }
              return row;
            });

          setRecords(cleanedData);
          setIsLoading(false);
        }
      });
    })
    .catch(err => {
      console.warn("Could not load data files automatically:", err);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Sync state to URL hash
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'schedule') params.set('tab', activeTab);
    if (filters.search) params.set('search', filters.search);
    if (filters.classCode) params.set('classCode', filters.classCode);
    if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
    if (filters.date) params.set('date', filters.date);
    if (monitorClass) params.set('monitorClass', monitorClass);
    if (sortConfig && sortConfig.key) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }

    const newHash = params.toString();
    const newUrl = newHash ? `#${newHash}` : window.location.pathname;
    
    if (window.location.hash !== `#${newHash}` && newHash !== '') {
       window.history.replaceState(null, '', newUrl);
    } else if (newHash === '' && window.location.hash !== '') {
       window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeTab, filters, monitorClass, sortConfig]);

  // Sync state from URL hash on browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const state = getInitialState();
      setActiveTab(state.tab);
      setFilters(prev => ({
        ...prev,
        search: state.search,
        classCode: state.classCode,
        subjectCode: state.subjectCode,
        date: state.date,
      }));
      setSearchInput(state.search);
      setMonitorClass(state.monitorClass);
      setSortConfig({ key: state.sortKey, direction: state.sortDir });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleDefaultClassChange = (cls: string) => {
    setDefaultClass(cls);
    localStorage.setItem('defaultClass', cls);
    setMonitorClass(cls);
  };

  // Extract unique values for filters
  const baseRecords = useMemo(() => {
    if (activeTab === 'personal_schedule' && currentUser) {
      return records.filter(r => r.MaSV === currentUser.username);
    }
    return records;
  }, [records, activeTab, currentUser]);

  const classes = useMemo(() => {
    const cls = new Set(baseRecords.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [baseRecords]);

  const subjects = useMemo(() => {
    const subs = new Map<string, string>();
    baseRecords.forEach((r) => {
      if (r.MaMH && r.TenMH) {
        subs.set(r.MaMH, r.TenMH);
      }
    });
    return Array.from(subs.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [baseRecords]);

  const dates = useMemo(() => {
    const dts = new Set<string>(baseRecords.map((r) => r.NgayThi).filter(Boolean));
    return Array.from(dts).sort((a, b) => {
      // Simple date sort assuming DD/MM/YYYY format, fallback to string compare
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      if (y1 !== y2) return y1 - y2;
      if (m1 !== m2) return m1 - m2;
      return d1 - d2;
    });
  }, [baseRecords]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    const normalizeString = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
    };

    return baseRecords.filter((record) => {
      const searchStr = normalizeString(filters.search);
      const studentId = normalizeString(record.MaSV || '');
      const studentName = normalizeString(`${record.HoLotSV || ''} ${record.TenSV || ''}`.replace(/\s+/g, ' '));
      const subjectName = normalizeString(record.TenMH || '');
      
      const matchSearch =
        !searchStr ||
        studentId.includes(searchStr) ||
        studentName.includes(searchStr) ||
        subjectName.includes(searchStr);

      const matchClass = !filters.classCode || record.MaLop === filters.classCode;
      const matchSubject = !filters.subjectCode || record.MaMH === filters.subjectCode;
      const matchDate = !filters.date || record.NgayThi === filters.date;

      return matchSearch && matchClass && matchSubject && matchDate;
    });
  }, [records, filters, activeTab, currentUser]);

  const handleReset = () => {
    setRecords([]);
    setFilters({ search: '', classCode: '', subjectCode: '', date: '' });
    setSearchInput('');
  };

  if (loginUsers.length > 0 && !currentUser) {
    return <LoginScreen users={loginUsers} onLogin={(user) => {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden relative">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            <h1 className="text-white font-semibold text-lg tracking-tight">S-Exam Portal</h1>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <div className="space-y-1">
            <button 
              onClick={() => handleTabChange('personal_schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'personal_schedule' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
            >
              <User className="w-5 h-5" /> Lịch Thi Cá Nhân
            </button>
            <button 
              onClick={() => handleTabChange('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'schedule' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
            >
              <Calendar className="w-5 h-5" /> Lịch Thi Tổng
            </button>
            <button 
              onClick={() => handleTabChange('monitors_list')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'monitors_list' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
            >
              <Users className="w-5 h-5" /> Danh Sách Lớp Trưởng
            </button>
            {showCourseCompare && (
              <button 
                onClick={() => handleTabChange('course_compare')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'course_compare' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
              >
                <BookOpen className="w-5 h-5" /> So sánh ĐKMH
              </button>
            )}
            <button 
              onClick={() => handleTabChange('members')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'members' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
            >
              <Users className="w-5 h-5" /> Danh Sách Lớp
            </button>
          </div>

          {isMonitor && (
            <div className="pt-2">
              <button 
                onClick={() => setIsClassGroupOpen(!isClassGroupOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-slate-400 hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-3 font-medium">
                  <GraduationCap className="w-5 h-5" /> Quản Lý Lớp
                </div>
                {isClassGroupOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>

              {isClassGroupOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1">
                  <button 
                    onClick={() => handleTabChange('monitor')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'monitor' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                  >
                    <Wrench className="w-4 h-4" /> Công Cụ & Thông Báo
                  </button>
                  <button 
                    onClick={() => handleTabChange('envelope')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'envelope' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                  >
                    <Mail className="w-4 h-4" /> Phân Công Phong Bì
                  </button>
                  <button 
                    onClick={() => handleTabChange('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                  >
                    <Settings className="w-4 h-4" /> Cài Đặt
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
        <div className="p-6 border-t border-slate-800 text-slate-500 text-xs text-center uppercase tracking-widest">
          HK2 2025 - 2026
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              className="flex items-center justify-center p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 hidden sm:block">
              {activeTab === 'schedule' ? 'Lịch Thi Tổng' : activeTab === 'personal_schedule' ? 'Lịch Thi Cá Nhân' : activeTab === 'monitors_list' ? 'Danh Sách Lớp Trưởng' : activeTab === 'course_compare' ? 'So Sánh ĐKMH' : activeTab === 'members' ? 'Danh Sách Lớp' : activeTab === 'envelope' ? 'Phân Công Phong Bì' : activeTab === 'settings' ? 'Cài Đặt' : 'Công Cụ Lớp Trưởng'}
            </h2>
            
            {records.length > 0 && (activeTab === 'schedule' || activeTab === 'personal_schedule') && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder={activeTab === 'personal_schedule' ? "Tìm môn thi..." : "Tìm theo mã SV, tên..."}
                  className="bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm w-48 md:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="px-3 md:px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold overflow-hidden" title={currentUser?.fullName || currentUser?.username || 'Admin'}>
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || 'Admin'}`} alt={currentUser?.fullName || currentUser?.username || 'Admin'} className="w-full h-full object-cover" />
            </div>
            {currentUser && (
              <button 
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('currentUser');
                }}
                className="px-3 md:px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-rose-100 text-rose-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <section className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : records.length === 0 ? (
            <UploadSection onDataLoaded={setRecords} />
          ) : (activeTab === 'schedule' || activeTab === 'personal_schedule') ? (
            selectedExamRoom ? (
              <ExamRoomMembers 
                roomRecord={selectedExamRoom}
                allRecords={records}
                onBack={() => setSelectedExamRoom(null)}
                onStudentClick={setConfirmStudentId}
                onClassClick={setConfirmClassCode}
              />
            ) : (
              <>
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  classes={classes}
                  subjects={subjects}
                  dates={dates}
                  totalRecords={baseRecords.length}
                  filteredCount={filteredRecords.length}
                  hideClassFilter={activeTab === 'personal_schedule'}
                />
                <DataTable 
                  records={filteredRecords} 
                  sortConfig={sortConfig} 
                  onSortChange={setSortConfig} 
                  onStudentClick={setConfirmStudentId}
                  onClassClick={setConfirmClassCode}
                  onRowClick={setSelectedExamRoom}
                />
              </>
            )
          ) : activeTab === 'monitor' ? (
            <ClassMonitorTools 
              records={records} 
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
            />
          ) : activeTab === 'envelope' ? (
            <RoomEnvelopeManager
              records={records}
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
              loginUsers={loginUsers}
            />
          ) : activeTab === 'settings' ? (
            <SettingsPanel
              records={records}
              defaultClass={defaultClass}
              onDefaultClassChange={handleDefaultClassChange}
            />
          ) : activeTab === 'monitors_list' ? (
            <MonitorsList 
              users={loginUsers} 
              onClassClick={(classCode) => {
                setMonitorClass(classCode);
                setActiveTab('members');
                setIsClassGroupOpen(true);
              }}
            />
          ) : activeTab === 'course_compare' ? (
            <CourseCompare data={courseCompareData} />
          ) : (
            <ClassMembers
              records={records}
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
            />
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      {confirmStudentId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Lọc theo sinh viên</h3>
            <p className="text-slate-600 mb-6">Bạn có muốn xem toàn bộ lịch thi của sinh viên có mã <strong>{confirmStudentId}</strong> không?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmStudentId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setSearchInput(confirmStudentId);
                  setFilters(prev => ({ ...prev, search: confirmStudentId }));
                  setConfirmStudentId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClassCode && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xem thông tin lớp</h3>
            <p className="text-slate-600 mb-6">Bạn có muốn xem danh sách thành viên của lớp <strong>{confirmClassCode}</strong> không?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmClassCode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setActiveTab('members');
                  setMonitorClass(confirmClassCode);
                  setConfirmClassCode(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
