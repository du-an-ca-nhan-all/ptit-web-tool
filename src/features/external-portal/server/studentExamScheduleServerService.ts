import { prisma } from '@/src/lib/prisma';
import { getValidTokenOrRefresh, loginAndGetToken } from './qldttxServerService';
import {
  dispatchQldtExamScheduleChanges,
  QldtExamChangeItem,
} from '@/src/features/telegram/server/telegramDispatcher';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

export interface StudentQldtExamItem {
  id: string;
  stt: number;
  maMon: string;
  tenMon: string;
  dotThi: string;
  kyThi: string;
  ngayThi: string; // DD/MM/YYYY
  gioBatDau: string; // HH:mm
  soPhut: string;
  hinhThucThi: string;
  maPhong: string;
  maCoSo: string;
  diaDiemThi: string;
  ghepPhong: string;
  nhomThi: string;
  toThi: string;
  ghepThi: string;
  siSo: number;
  camThi: string;
  ghiChu: string;
  isPostponed: boolean;
  dateIso: string; // YYYY-MM-DD
  daysUntil: number; // âm: đã thi, 0: hôm nay, dương: sắp thi
  rawItem?: any;
}

export interface StudentQldtSemester {
  hocKy: number;
  tenHocKy: string;
  ngayBatDauHk?: string;
  ngayKetThucHk?: string;
}

export interface StudentQldtExamScheduleResult {
  success: boolean;
  username: string;
  semesterId: number;
  semesterName?: string;
  semesters: StudentQldtSemester[];
  exams: StudentQldtExamItem[];
  upcomingExams: StudentQldtExamItem[];
  pastExams: StudentQldtExamItem[];
  totalExams: number;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  isCachedDb?: boolean;
  lastSyncAt: string | null;
  noticeNoTuitionFee?: string;
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}

export const EXAM_AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const STATIC_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
  'Content-Type': 'application/json',
  Origin: 'https://qldttx.pttc1.edu.vn',
  Referer: 'https://qldttx.pttc1.edu.vn/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  idpc: '0',
};

export const QLDTTX_EXAM_SEMESTERS_URL = 'https://qldttx.pttc1.edu.vn/api/report/w-locdshockylichthisinhvien';
export const QLDTTX_PERSONAL_EXAMS_URL = 'https://qldttx.pttc1.edu.vn/api/epm/w-locdslichthisvtheohocky';

/**
 * Lấy danh sách học kỳ lịch thi từ cổng QLDTTX
 */
export async function fetchStudentExamSemestersFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  semesters: StudentQldtSemester[];
  currentSemester: number;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const bodyPayload = {
    filter: { is_tieng_anh: null },
    additional: { paging: { limit: 100, page: 1 }, ordering: [{ name: null, order_type: 1 }] },
  };

  let response = await fetch(QLDTTX_EXAM_SEMESTERS_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  let newToken: string | undefined = isNew ? validToken : undefined;

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    newToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_EXAM_SEMESTERS_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
    });
  }

  if (!response.ok) {
    throw new Error(`Lỗi lấy danh sách học kỳ lịch thi QLDTTX (${response.status})`);
  }

  const json = await response.json();
  const rawSemesters: any[] = json?.data?.ds_hoc_ky || [];
  const semesters: StudentQldtSemester[] = rawSemesters.map((s) => ({
    hocKy: Number(s.hoc_ky),
    tenHocKy: s.ten_hoc_ky || `Học kỳ ${s.hoc_ky}`,
    ngayBatDauHk: s.ngay_bat_dau_hk,
    ngayKetThucHk: s.ngay_ket_thuc_hk,
  }));

  const currentSemester = semesters[0]?.hocKy || 20251;

  return {
    semesters,
    currentSemester,
    newToken,
  };
}

/**
 * Lấy danh sách lịch thi cá nhân theo học kỳ từ cổng QLDTTX
 */
export async function fetchStudentPersonalExamsFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
  idHocKy?: number | string | null;
}): Promise<{
  data: any;
  exams: any[];
  currentSemester: number;
  noticeNoTuitionFee?: string;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
    if (isNew) accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  let hocKyNum = Number(account.idHocKy);
  if (!hocKyNum || isNaN(hocKyNum)) {
    try {
      const semRes = await fetchStudentExamSemestersFromQLDTTX({
        username: account.username,
        password: account.password,
        token: validToken,
      });
      hocKyNum = semRes.currentSemester;
      if (semRes.newToken) {
        validToken = semRes.newToken;
        accumulatedToken = semRes.newToken;
      }
    } catch {
      hocKyNum = 20251;
    }
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const bodyPayload = {
    filter: { hoc_ky: hocKyNum, is_giua_ky: false },
    additional: { paging: { limit: 100, page: 1 }, ordering: [{ name: null, order_type: null }] },
  };

  let response = await fetch(QLDTTX_PERSONAL_EXAMS_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_PERSONAL_EXAMS_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
    });
  }

  if (!response.ok) {
    throw new Error(`Lỗi lấy lịch thi cá nhân QLDTTX (${response.status})`);
  }

  const json = await response.json();
  const data = json?.data || {};
  const exams = Array.isArray(data?.ds_lich_thi) ? data.ds_lich_thi : [];

  return {
    data,
    exams,
    currentSemester: hocKyNum,
    noticeNoTuitionFee: data?.thong_bao_no_hoc_phi || undefined,
    newToken: accumulatedToken,
  };
}

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

function normalizeExamCode(item: any): string {
  return (item.ma_mon || item.maMon || item.MaMH || '').toUpperCase().trim();
}

function normalizeExamSemester(item: any): string {
  const hk = item.hoc_ky !== undefined && item.hoc_ky !== null ? item.hoc_ky : item.hocKy;
  if (hk !== undefined && hk !== null && String(hk).trim()) return String(hk).trim();
  const dt = item.dot_thi !== undefined && item.dot_thi !== null ? item.dot_thi : item.dotThi;
  if (dt !== undefined && dt !== null && String(dt).trim()) return String(dt).trim();
  return '';
}

function normalizeExamDateStr(item: any): string {
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

function normalizeExamTimeStr(item: any): string {
  const raw = item.gio_bat_dau || item.gioBatDau || item.GioThi || '';
  if (!raw) return '';
  const s = String(raw).trim();
  const parts = s.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return s;
}

function normalizeExamRoomStr(item: any): string {
  const raw = item.ma_phong || item.maPhong || item.MAPTHI || '';
  return String(raw).trim().toUpperCase();
}

function normalizeExamAddressStr(item: any): string {
  const raw = item.dia_diem_thi || item.diaDiemThi || item.DiaDiem || '';
  return String(raw)
    .replace(/<br\s*\/?>/gi, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExamFormatStr(item: any): string {
  const raw = item.hinh_thuc_thi || item.hinhThucThi || item.ghi_chu_htt || item.MaHTThi || '';
  return String(raw).replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeExamGroupStr(item: any): string {
  const to = String(item.to_thi || item.toThi || '').trim();
  const nhom = String(item.nhom_thi || item.nhomThi || '').trim();
  return `${to}|${nhom}`;
}

function normalizeExamBanStatus(item: any): boolean {
  const val = item.cam_thi !== undefined ? item.cam_thi : item.camThi;
  if (val === true || val === 1 || val === '1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'cấm thi' || s === 'bị cấm thi' || s === 'true';
  }
  return false;
}

function getExamUniqueKey(item: any): string {
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

/**
 * So sánh và phát hiện biến động lịch thi giữa dữ liệu cũ và dữ liệu mới (hỗ trợ tất cả các học kỳ)
 */
export function detectExamScheduleChanges(
  oldRawExams: any[],
  newRawExams: any[]
): QldtExamChangeItem[] {
  const changes: QldtExamChangeItem[] = [];
  if (!Array.isArray(oldRawExams) || !Array.isArray(newRawExams)) return changes;

  const oldMap = new Map<string, any>();
  oldRawExams.forEach((item) => {
    const key = getExamUniqueKey(item);
    if (key) oldMap.set(key, item);
  });

  const newMap = new Map<string, any>();
  newRawExams.forEach((item) => {
    const key = getExamUniqueKey(item);
    if (key) newMap.set(key, item);
  });

  // 1. Kiểm tra môn thi mới hoặc bị thay đổi trong newRawExams
  newRawExams.forEach((newEx) => {
    const key = getExamUniqueKey(newEx);
    const code = normalizeExamCode(newEx);
    if (!key || !code) return;

    const baseName = newEx.ten_mon || newEx.tenMon || newEx.TenMH || 'Môn thi';
    const semName = newEx.ten_hoc_ky || (newEx.hoc_ky ? `HK ${newEx.hoc_ky}` : '');
    const tenMon = semName ? `${baseName} (${semName})` : baseName;

    const oldEx = oldMap.get(key);

    if (!oldEx) {
      // Môn thi mới được xếp lịch
      const diffs: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
      const newDate = normalizeExamDateStr(newEx);
      const newTime = normalizeExamTimeStr(newEx);
      const newRoom = normalizeExamRoomStr(newEx);
      const newFormat = newEx.hinh_thuc_thi || newEx.hinhThucThi || '';
      const newAddress = normalizeExamAddressStr(newEx);

      if (newDate) diffs.push({ field: 'ngayThi', label: 'Ngày thi', oldVal: '', newVal: newDate });
      if (newTime) diffs.push({ field: 'gioBatDau', label: 'Giờ thi', oldVal: '', newVal: newTime });
      if (newRoom) diffs.push({ field: 'maPhong', label: 'Phòng thi', oldVal: '', newVal: newRoom });
      if (newFormat) diffs.push({ field: 'hinhThucThi', label: 'Hình thức', oldVal: '', newVal: newFormat });
      if (newAddress) diffs.push({ field: 'diaDiemThi', label: 'Địa điểm', oldVal: '', newVal: newAddress });

      changes.push({
        maMon: code,
        tenMon,
        type: 'NEW',
        diffs,
      });
    } else {
      // So sánh các trường thông tin quan trọng sau khi chuẩn hoá
      const diffs: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];

      const oldDate = normalizeExamDateStr(oldEx);
      const newDate = normalizeExamDateStr(newEx);
      if (oldDate !== newDate && (oldDate || newDate)) {
        diffs.push({ field: 'ngayThi', label: 'Ngày thi', oldVal: oldDate || 'Chưa có', newVal: newDate || 'Chưa có' });
      }

      const oldTime = normalizeExamTimeStr(oldEx);
      const newTime = normalizeExamTimeStr(newEx);
      if (oldTime !== newTime && (oldTime || newTime)) {
        diffs.push({ field: 'gioBatDau', label: 'Giờ thi', oldVal: oldTime || 'Chưa có', newVal: newTime || 'Chưa có' });
      }

      const oldRoom = normalizeExamRoomStr(oldEx);
      const newRoom = normalizeExamRoomStr(newEx);
      if (oldRoom !== newRoom && (oldRoom || newRoom)) {
        diffs.push({ field: 'maPhong', label: 'Phòng thi', oldVal: oldRoom || 'Chưa xếp', newVal: newRoom || 'Chưa xếp' });
      }

      const oldAddress = normalizeExamAddressStr(oldEx);
      const newAddress = normalizeExamAddressStr(newEx);
      if (oldAddress !== newAddress && (oldAddress || newAddress)) {
        diffs.push({ field: 'diaDiemThi', label: 'Địa điểm thi', oldVal: oldAddress || 'Chưa có', newVal: newAddress || 'Chưa có' });
      }

      const oldFormat = normalizeExamFormatStr(oldEx);
      const newFormat = normalizeExamFormatStr(newEx);
      if (oldFormat !== newFormat && (oldFormat || newFormat)) {
        const rawOldF = oldEx.hinh_thuc_thi || oldEx.hinhThucThi || 'Trắc nghiệm';
        const rawNewF = newEx.hinh_thuc_thi || newEx.hinhThucThi || 'Trắc nghiệm';
        diffs.push({ field: 'hinhThucThi', label: 'Hình thức thi', oldVal: rawOldF, newVal: rawNewF });
      }

      const oldGroup = normalizeExamGroupStr(oldEx);
      const newGroup = normalizeExamGroupStr(newEx);
      if (oldGroup !== newGroup && (oldGroup !== '|' || newGroup !== '|')) {
        const [oldTo, oldNhom] = oldGroup.split('|');
        const [newTo, newNhom] = newGroup.split('|');
        diffs.push({
          field: 'toThi',
          label: 'Tổ / Nhóm thi',
          oldVal: `Tổ ${oldTo || '0'} - Nhóm ${oldNhom || '0'}`,
          newVal: `Tổ ${newTo || '0'} - Nhóm ${newNhom || '0'}`,
        });
      }

      const oldBan = normalizeExamBanStatus(oldEx);
      const newBan = normalizeExamBanStatus(newEx);
      if (oldBan !== newBan) {
        diffs.push({
          field: 'camThi',
          label: 'Trạng thái cấm thi',
          oldVal: oldBan ? 'Bị cấm thi' : 'Được dự thi',
          newVal: newBan ? 'Bị cấm thi' : 'Được dự thi',
        });
      }

      if (diffs.length > 0) {
        changes.push({
          maMon: code,
          tenMon,
          type: 'MODIFIED',
          diffs,
        });
      }
    }
  });

  // 2. Kiểm tra môn thi bị huỷ (có trong cũ nhưng biến mất trong mới)
  oldRawExams.forEach((oldEx) => {
    const key = getExamUniqueKey(oldEx);
    const code = normalizeExamCode(oldEx);
    if (!key || !code) return;

    if (!newMap.has(key)) {
      const baseName = oldEx.ten_mon || oldEx.tenMon || oldEx.TenMH || 'Môn thi';
      const semName = oldEx.ten_hoc_ky || (oldEx.hoc_ky ? `HK ${oldEx.hoc_ky}` : '');
      const tenMon = semName ? `${baseName} (${semName})` : baseName;
      const oldDate = normalizeExamDateStr(oldEx);
      const oldTime = normalizeExamTimeStr(oldEx);

      changes.push({
        maMon: code,
        tenMon,
        type: 'CANCELLED',
        diffs: [
          {
            field: 'status',
            label: 'Trạng thái',
            oldVal: oldDate ? `Lịch ngày ${oldDate} (${oldTime || ''})` : 'Đã xếp lịch',
            newVal: 'Đã rút khỏi lịch thi',
          },
        ],
      });
    }
  });

  return changes;
}

/**
 * Lấy lịch thi cá nhân từ Cổng QLDTTX (kết hợp cache DB StudentQldtExamRecord)
 * Đồng bộ toàn bộ các học kỳ (semesters & all exams) và so sánh biến động
 */
export async function getStudentQldtExamSchedule(
  username: string,
  options?: { forceRefresh?: boolean; semesterId?: number }
): Promise<StudentQldtExamScheduleResult> {
  const cleanUsername = username.trim().toUpperCase();
  let currentSemester = options?.semesterId || 20251;

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  if (!isConfigured) {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      semesters: [],
      exams: [],
      upcomingExams: [],
      pastExams: [],
      totalExams: 0,
      isConfigured: false,
      hasLinkedAccount: false,
      isLiveSync: false,
      isCachedDb: false,
      lastSyncAt: null,
      errorType: 'NOT_CONFIGURED',
      error:
        'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Lịch Thi Cá Nhân từ QLDTTX.',
    };
  }

  // 2. Kiểm tra cache trong DB (bảng StudentQldtExamRecord)
  let cachedRecord: any = null;
  try {
    cachedRecord = await prisma.studentQldtExamRecord.findUnique({
      where: { username: cleanUsername },
    });
  } catch (err) {
    console.warn('[getStudentQldtExamSchedule] Lỗi đọc DB StudentQldtExamRecord:', err);
  }

  const lastPulled = cachedRecord?.lastPulledAt || cachedRecord?.updatedAt;
  const ageMs = lastPulled ? Date.now() - new Date(lastPulled).getTime() : Infinity;
  const isCacheFresh = cachedRecord && cachedRecord.rawData && ageMs < EXAM_AUTO_REFRESH_INTERVAL_MS;

  // Trả về từ DB cache nếu còn hạn và không forceRefresh
  if (!options?.forceRefresh && isCacheFresh) {
    try {
      const parsed = JSON.parse(cachedRecord.rawData);
      const semesters: StudentQldtSemester[] = parsed?.semesters || [];
      const semId = options?.semesterId || cachedRecord.semesterId || parsed.currentSemester || semesters[0]?.hocKy || currentSemester;

      let rawExams: any[] = [];
      if (parsed?.examsBySemester && parsed.examsBySemester[semId]) {
        rawExams = parsed.examsBySemester[semId];
      } else if (Array.isArray(parsed?.allExams)) {
        rawExams = parsed.allExams.filter((e: any) => Number(e.hoc_ky || e.hocKy) === semId);
        if (rawExams.length === 0 && !options?.semesterId) {
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
    } catch (parseErr) {
      console.warn('[getStudentQldtExamSchedule] Parse rawData từ cache lỗi:', parseErr);
    }
  }

  // 3. Kéo live từ QLDTTX (Đồng bộ tất cả học kỳ và toàn bộ ca thi)
  let authErrorDetected = false;
  let authErrorMessage = '';

  try {
    // 3.1 Lấy danh sách toàn bộ học kỳ từ Cổng QLDTTX
    const semRes = await fetchStudentExamSemestersFromQLDTTX({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
    });

    const targetHocKy = options?.semesterId || semRes.currentSemester || semRes.semesters[0]?.hocKy || 20251;
    const semestersToFetch =
      semRes.semesters && semRes.semesters.length > 0
        ? semRes.semesters
        : [{ hocKy: targetHocKy, tenHocKy: `Học kỳ ${targetHocKy}` }];

    // 3.2 Lấy chi tiết lịch thi cho TẤT CẢ các học kỳ
    const allExamsBySemester: Record<number, any[]> = {};
    const allRawExamsList: any[] = [];
    let currentToken = semRes.newToken || extAccount!.token;
    let firstNoticeNoTuitionFee: string | undefined = undefined;

    for (const sem of semestersToFetch) {
      try {
        const examRes = await fetchStudentPersonalExamsFromQLDTTX({
          username: extAccount!.extUsername || cleanUsername,
          password: extAccount!.extPassword || undefined,
          token: currentToken,
          idHocKy: sem.hocKy,
        });

        if (examRes.newToken) {
          currentToken = examRes.newToken;
        }

        if (examRes.noticeNoTuitionFee && !firstNoticeNoTuitionFee) {
          firstNoticeNoTuitionFee = examRes.noticeNoTuitionFee;
        }

        const rawList = (examRes.exams || []).map((ex: any) => ({
          ...ex,
          hoc_ky: sem.hocKy,
          ten_hoc_ky: sem.tenHocKy,
        }));

        allExamsBySemester[sem.hocKy] = rawList;
        allRawExamsList.push(...rawList);
      } catch (semErr) {
        console.warn(`[getStudentQldtExamSchedule] Lỗi kéo lịch thi học kỳ ${sem.hocKy} cho ${cleanUsername}:`, semErr);
        allExamsBySemester[sem.hocKy] = [];
      }
    }

    if (currentToken && currentToken !== extAccount!.token) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            token: currentToken,
            lastSyncAt: new Date(),
            status: 'CONNECTED',
            syncMessage: 'Đồng bộ lịch thi thành công từ QLDTTX.',
          },
        })
        .catch(() => {});
    }

    const currentSemesterExams = allExamsBySemester[targetHocKy] || [];

    const payloadToStore = {
      semesters: semRes.semesters,
      examsBySemester: allExamsBySemester,
      allExams: allRawExamsList,
      exams: currentSemesterExams,
      currentSemester: targetHocKy,
      noticeNoTuitionFee: firstNoticeNoTuitionFee,
    };

    const resultObj = buildQldtExamResultFromRawData(
      cleanUsername,
      currentSemesterExams,
      targetHocKy,
      semRes.semesters,
      {
        isConfigured: true,
        isLiveSync: true,
        isCachedDb: false,
        lastSyncAt: new Date().toISOString(),
        noticeNoTuitionFee: firstNoticeNoTuitionFee,
      }
    );

    // 3.3 Phát hiện biến động lịch thi TOÀN BỘ CÁC MÔN so với cache cũ và gửi thông báo Telegram
    if (cachedRecord?.rawData) {
      try {
        const oldParsed = JSON.parse(cachedRecord.rawData);
        const oldExamsList = oldParsed?.allExams || oldParsed?.exams || oldParsed?.data?.ds_lich_thi || [];
        if (
          Array.isArray(oldExamsList) &&
          oldExamsList.length > 0 &&
          allRawExamsList.length > 0
        ) {
          const detectedDiffs = detectExamScheduleChanges(oldExamsList, allRawExamsList);
          if (detectedDiffs.length > 0) {
            console.log(`🔔 [QLDT Exam Schedule] Phát hiện ${detectedDiffs.length} thay đổi lịch thi cho sinh viên ${cleanUsername}!`);
            
            // Gửi Telegram bất đồng bộ (không chặn luồng lưu dữ liệu)
            dispatchQldtExamScheduleChanges({
              username: cleanUsername,
              semesterName: resultObj.semesterName,
              changes: detectedDiffs,
            }).catch((dispatchErr) => {
              console.error(`[QLDT Exam Schedule] Gửi thông báo biến động lịch thi cho ${cleanUsername} thất bại:`, dispatchErr);
            });

            // Ghi nhật ký hoạt động hệ thống
            logActivity({
              userId: null,
              username: cleanUsername,
              userRole: 'SYSTEM',
              action: 'QLDT_EXAM_SCHEDULE_CHANGED',
              targetType: 'EXAM_SCHEDULE',
              targetId: cleanUsername,
              description: `Phát hiện ${detectedDiffs.length} biến động trong lịch thi cá nhân từ Cổng QLDTTX`,
              metadata: { cleanUsername, changesCount: detectedDiffs.length, changes: detectedDiffs },
            }).catch(() => {});
          }
        }
      } catch (diffErr) {
        console.warn(`[getStudentQldtExamSchedule] Lỗi khi so sánh biến động lịch thi cho ${cleanUsername}:`, diffErr);
      }
    }

    // 4. Lưu / Persist toàn bộ dữ liệu vào bảng StudentQldtExamRecord
    try {
      await prisma.studentQldtExamRecord.upsert({
        where: { username: cleanUsername },
        create: {
          username: cleanUsername,
          rawData: JSON.stringify(payloadToStore),
          semesterId: targetHocKy,
          semesterName: resultObj.semesterName,
          totalExams: allRawExamsList.length,
          lastPulledAt: new Date(),
        },
        update: {
          rawData: JSON.stringify(payloadToStore),
          semesterId: targetHocKy,
          semesterName: resultObj.semesterName,
          totalExams: allRawExamsList.length,
          lastPulledAt: new Date(),
        },
      });
    } catch (saveErr) {
      console.error('[getStudentQldtExamSchedule] Lưu StudentQldtExamRecord thất bại:', saveErr);
    }

    return resultObj;
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentQldtExamSchedule] Lỗi kết nối QLDTTX cho ${cleanUsername}:`, err?.message);

    if (
      errMsg.includes('401') ||
      errMsg.includes('403') ||
      errMsg.includes('không thành công') ||
      errMsg.includes('mật khẩu') ||
      errMsg.includes('tài khoản') ||
      errMsg.includes('đăng nhập') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('forbidden') ||
      errMsg.includes('không đúng') ||
      errMsg.includes('user không tồn tại')
    ) {
      authErrorDetected = true;
      authErrorMessage = err.message || 'Tài khoản hoặc mật khẩu QLDTTX không chính xác.';

      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.',
          },
        })
        .catch(() => {});
    }
  }

  // Nếu SAI USERNAME / PASSWORD -> Chặn truy cập và trả về errorType INVALID_CREDENTIALS
  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      semesters: [],
      exams: [],
      upcomingExams: [],
      pastExams: [],
      totalExams: 0,
      isConfigured: true,
      hasLinkedAccount: true,
      isLiveSync: false,
      isCachedDb: false,
      lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
      errorType: 'INVALID_CREDENTIALS',
      error:
        authErrorMessage ||
        'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) không chính xác hoặc đã bị đổi. Vui lòng kiểm tra và cập nhật lại thông tin đăng nhập.',
    };
  }

  // Fallback 1: Trả về dữ liệu từ bảng StudentQldtExamRecord đã lưu trước đó nếu có (khi mạng QLDTTX gặp sự cố)
  if (cachedRecord && cachedRecord.rawData) {
    try {
      const parsed = JSON.parse(cachedRecord.rawData);
      const semesters: StudentQldtSemester[] = parsed?.semesters || [];
      const semId = options?.semesterId || cachedRecord.semesterId || parsed.currentSemester || semesters[0]?.hocKy || currentSemester;

      let rawExams: any[] = [];
      if (parsed?.examsBySemester && parsed.examsBySemester[semId]) {
        rawExams = parsed.examsBySemester[semId];
      } else if (Array.isArray(parsed?.allExams)) {
        rawExams = parsed.allExams.filter((e: any) => Number(e.hoc_ky || e.hocKy) === semId);
        if (rawExams.length === 0 && !options?.semesterId) {
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
    } catch (dbErr) {
      console.error('[getStudentQldtExamSchedule] Fallback StudentQldtExamRecord lỗi:', dbErr);
    }
  }

  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
    semesters: [],
    exams: [],
    upcomingExams: [],
    pastExams: [],
    totalExams: 0,
    isConfigured: true,
    hasLinkedAccount: true,
    isLiveSync: false,
    isCachedDb: false,
    lastSyncAt: null,
  };
}
