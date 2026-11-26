import type {
  StudentQldtExamItem,
  StudentQldtExamScheduleResult,
  StudentQldtSemester,
} from './types';

function parseExamDateToIso(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
}

function calculateDaysUntil(dateIso: string): number {
  if (!dateIso) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dateIso.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 0;
  const target = new Date(y, m - 1, d);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Chuẩn hóa danh sách ca thi từ dữ liệu raw QLDTTX
 */
export function buildQldtExamResultFromRawData(
  cleanUsername: string,
  rawExams: any[],
  currentSemester: number,
  semesters: StudentQldtSemester[],
  options: {
    isConfigured: boolean;
    isLiveSync: boolean;
    isCachedDb: boolean;
    lastSyncAt: string | null;
    semesterName?: string;
    noticeNoTuitionFee?: string;
  }
): StudentQldtExamScheduleResult {
  const currentSemObj = semesters.find((s) => s.hocKy === currentSemester);
  const semesterName =
    options.semesterName ||
    currentSemObj?.tenHocKy ||
    `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`;

  const exams: StudentQldtExamItem[] = rawExams.map((item, idx) => {
    const ngayThi = item.ngay_thi || '';
    const dateIso = parseExamDateToIso(ngayThi);
    const daysUntil = calculateDaysUntil(dateIso);
    const cleanAddress = (item.dia_diem_thi || '').replace(/<br\s*\/?>/gi, ' - ').trim();

    return {
      id: `qldt_exam_${item.id_nhom_thi || idx}_${item.ma_mon || idx}`,
      stt: Number(item.so_thu_tu) || idx + 1,
      maMon: (item.ma_mon || '').toUpperCase(),
      tenMon: item.ten_mon || 'Môn thi',
      dotThi: item.dot_thi || String(currentSemester),
      kyThi: item.ky_thi || 'Thi kết thúc môn',
      ngayThi,
      gioBatDau: item.gio_bat_dau || '',
      soPhut: item.so_phut ? `${item.so_phut} phút` : '',
      hinhThucThi: item.hinh_thuc_thi || item.ghi_chu_htt || 'Trắc nghiệm',
      maPhong: item.ma_phong || '',
      maCoSo: item.ma_co_so || '',
      diaDiemThi: cleanAddress || item.dia_diem_thi || '',
      ghepPhong: item.ghep_phong || '',
      nhomThi: item.nhom_thi || '',
      toThi: item.to_thi || '',
      ghepThi: item.ghep_thi || '',
      siSo: Number(item.si_so) || 0,
      camThi: item.cam_thi || '',
      ghiChu: item.ghi_chu_du_thi || '',
      isPostponed: false,
      dateIso,
      daysUntil,
      rawItem: item,
    };
  });

  // Sắp xếp các ca thi theo ngày thi và giờ bắt đầu
  exams.sort((a, b) => {
    if (a.dateIso !== b.dateIso) return a.dateIso.localeCompare(b.dateIso);
    return a.gioBatDau.localeCompare(b.gioBatDau);
  });

  const nowIso = new Date().toISOString().slice(0, 10);
  const upcomingExams = exams.filter((e) => e.dateIso >= nowIso);
  const pastExams = exams.filter((e) => e.dateIso < nowIso);

  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName,
    semesters,
    exams,
    upcomingExams,
    pastExams,
    totalExams: exams.length,
    isConfigured: options.isConfigured,
    hasLinkedAccount: options.isConfigured,
    isLiveSync: options.isLiveSync,
    isCachedDb: options.isCachedDb,
    lastSyncAt: options.lastSyncAt,
    noticeNoTuitionFee: options.noticeNoTuitionFee,
  };
}

export function buildResultFromCachedRawData(
  cleanUsername: string,
  cachedRecord: any,
  currentSemester: number,
  lastPulled: Date | string | null | undefined,
  requestedSemesterId?: number
): StudentQldtExamScheduleResult {
  const parsed = JSON.parse(cachedRecord.rawData);
  const semesters: StudentQldtSemester[] = parsed?.semesters || [];
  const semId =
    requestedSemesterId ||
    cachedRecord.semesterId ||
    parsed.currentSemester ||
    semesters[0]?.hocKy ||
    currentSemester;

  let rawExams: any[] = [];
  if (parsed?.examsBySemester && parsed.examsBySemester[semId]) {
    rawExams = parsed.examsBySemester[semId];
  } else if (Array.isArray(parsed?.allExams)) {
    rawExams = parsed.allExams.filter((e: any) => Number(e.hoc_ky || e.hocKy) === semId);
    if (rawExams.length === 0 && !requestedSemesterId) {
      rawExams = parsed.allExams;
    }
  } else {
    rawExams = parsed?.exams || parsed?.data?.ds_lich_thi || (Array.isArray(parsed) ? parsed : []) || [];
  }

  return buildQldtExamResultFromRawData(cleanUsername, rawExams, semId, semesters, {
    isConfigured: true,
    isLiveSync: false,
    isCachedDb: true,
    lastSyncAt: lastPulled ? new Date(lastPulled).toISOString() : null,
    semesterName: cachedRecord.semesterName || undefined,
    noticeNoTuitionFee: parsed?.noticeNoTuitionFee,
  });
}

export function normalizeExamCode(item: any): string {
  return (item.ma_mon || item.maMon || item.MaMH || '').toUpperCase().trim();
}

export function normalizeExamSemester(item: any): string {
  const hk = item.hoc_ky !== undefined && item.hoc_ky !== null ? item.hoc_ky : item.hocKy;
  if (hk !== undefined && hk !== null && String(hk).trim()) return String(hk).trim();
  const dt = item.dot_thi !== undefined && item.dot_thi !== null ? item.dot_thi : item.dotThi;
  if (dt !== undefined && dt !== null && String(dt).trim()) return String(dt).trim();
  return '';
}

export function normalizeExamDateStr(item: any): string {
  const raw = item.ngay_thi || item.ngayThi || item.NgayThi || item.dateIso || '';
  if (!raw) return '';
  const s = String(raw).trim();
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    // DD/MM/YYYY
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return s;
}

export function normalizeExamTimeStr(item: any): string {
  const raw = item.gio_bat_dau || item.gioBatDau || item.GioThi || '';
  if (!raw) return '';
  const s = String(raw).trim();
  const parts = s.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return s;
}

export function normalizeExamRoomStr(item: any): string {
  const raw = item.ma_phong || item.maPhong || item.MAPTHI || '';
  return String(raw).trim().toUpperCase();
}

export function normalizeExamAddressStr(item: any): string {
  const raw = item.ghep_phong || item.dia_diem_thi || item.diaDiemThi || item.DiaDiem || '';
  return String(raw)
    .replace(/<br\s*\/?>/gi, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeExamFormatStr(item: any): string {
  const raw = item.hinh_thuc_thi || item.hinhThucThi || item.ghi_chu_htt || item.MaHTThi || '';
  return String(raw).replace(/\s+/g, ' ').trim().toLowerCase();
}

export function normalizeExamGroupStr(item: any): string {
  const to = String(item.to_thi || item.toThi || '').trim();
  const nhom = String(item.nhom_thi || item.nhomThi || '').trim();
  return `${to}|${nhom}`;
}

export function normalizeExamBanStatus(item: any): boolean {
  const val = item.cam_thi !== undefined ? item.cam_thi : item.camThi;
  if (val === true || val === 1 || val === '1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'cấm thi' || s === 'bị cấm thi' || s === 'true';
  }
  return false;
}

export function getExamUniqueKey(item: any): string {
  const idNhom = item.id_nhom_thi || item.idNhomThi;
  const code = normalizeExamCode(item);
  const sem = normalizeExamSemester(item);

  if (idNhom && code) return `${code}_id${idNhom}`;
  if (code && sem) {
    const grp = normalizeExamGroupStr(item);
    return `${code}_sem${sem}_grp${grp}`;
  }
  return code;
}
