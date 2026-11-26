import { AVAILABLE_EXTERNAL_SYSTEMS } from '../../../../types';
import {
  AccountFormData,
  AccountMetrics,
  ExternalAccountAdminItem,
  ModalTestStatus,
  StatusFilter,
} from './types';

export function createDefaultFormData(): AccountFormData {
  return {
    username: '',
    extUsername: '',
    extPassword: '',
    refreshToken: '',
    systemKey: AVAILABLE_EXTERNAL_SYSTEMS[0]?.key || 'QLDTTX_PTTC1',
    systemName: AVAILABLE_EXTERNAL_SYSTEMS[0]?.name || 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
    systemUrl: AVAILABLE_EXTERNAL_SYSTEMS[0]?.url || 'https://qldttx.pttc1.edu.vn/',
  };
}

export function createEditFormData(acc: ExternalAccountAdminItem): AccountFormData {
  return {
    username: acc.username,
    extUsername: acc.extUsername,
    extPassword: acc.extPassword || '',
    refreshToken: acc.refreshToken || '',
    systemKey: acc.systemKey,
    systemName: acc.systemName,
    systemUrl: acc.systemUrl,
  };
}

export function extractClassList(accounts: ExternalAccountAdminItem[]): string[] {
  const set = new Set<string>();
  accounts.forEach((a) => {
    if (a.maLop && a.maLop !== 'Chưa phân lớp') set.add(a.maLop);
  });
  return Array.from(set).sort();
}

export interface FilterAccountsParams {
  accounts: ExternalAccountAdminItem[];
  searchQuery: string;
  selectedClass: string;
  selectedSystem: string;
  statusFilter: StatusFilter;
}

export function filterAccounts({
  accounts,
  searchQuery,
  selectedClass,
  selectedSystem,
  statusFilter,
}: FilterAccountsParams): ExternalAccountAdminItem[] {
  return accounts.filter((a) => {
    // Search
    const matchSearch =
      !searchQuery.trim() ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.maLop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.extUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.soDienThoai && a.soDienThoai.includes(searchQuery));

    // Class
    const matchClass = selectedClass === 'ALL' || a.maLop === selectedClass;

    // System
    const matchSystem = selectedSystem === 'ALL' || a.systemKey === selectedSystem;

    // Status
    let matchStatus = true;
    if (statusFilter === 'CONNECTED') matchStatus = a.status === 'CONNECTED';
    else if (statusFilter === 'ERROR') matchStatus = a.status === 'ERROR';
    else if (statusFilter === 'HAS_TOKEN') matchStatus = !!a.token;

    return matchSearch && matchClass && matchStatus && matchSystem;
  });
}

export function computeAccountMetrics(
  accounts: ExternalAccountAdminItem[],
  totalStudents: number
): AccountMetrics {
  const connectedCount = accounts.filter((a) => a.status === 'CONNECTED').length;
  const hasTokenCount = accounts.filter((a) => !!a.token).length;
  const qldttxAccounts = accounts.filter((a) => a.systemKey === 'QLDTTX_PTTC1');
  const qldttxCount = qldttxAccounts.length;
  const qldttxTokenCount = qldttxAccounts.filter((a) => !!a.token).length;
  const lmsAccounts = accounts.filter((a) => a.systemKey === 'LMS_PTTC1');
  const lmsCount = lmsAccounts.length;
  const lmsTokenCount = lmsAccounts.filter((a) => !!a.token).length;
  const slinkAccounts = accounts.filter((a) => a.systemKey === 'SLINK_PTIT');
  const slinkCount = slinkAccounts.length;
  const slinkTokenCount = slinkAccounts.filter((a) => !!a.token).length;
  const coveragePercent = totalStudents > 0 ? ((accounts.length / totalStudents) * 100).toFixed(1) : '0';

  return {
    connectedCount,
    hasTokenCount,
    qldttxCount,
    qldttxTokenCount,
    lmsCount,
    lmsTokenCount,
    slinkCount,
    slinkTokenCount,
    coveragePercent,
  };
}

export interface IsModalTestPassedParams {
  formData: AccountFormData;
  modalTestStatus: ModalTestStatus;
  lastTestedModalUser: string;
  lastTestedModalPass: string;
  lastTestedModalRefreshToken: string;
}

export function isModalTestPassed({
  formData,
  modalTestStatus,
  lastTestedModalUser,
  lastTestedModalPass,
  lastTestedModalRefreshToken,
}: IsModalTestPassedParams): boolean {
  const isSlink = formData.systemKey === 'SLINK_PTIT';
  return isSlink
    ? modalTestStatus === 'SUCCESS' &&
        Boolean(formData.refreshToken.trim()) &&
        formData.refreshToken.trim() === lastTestedModalRefreshToken
    : modalTestStatus === 'SUCCESS' &&
        formData.extUsername.trim() === lastTestedModalUser &&
        formData.extPassword.trim() === lastTestedModalPass;
}

export function isSyncMessageError(status: string, syncMessage: string): boolean {
  return (
    status === 'ERROR' ||
    syncMessage.toLowerCase().includes('lỗi') ||
    syncMessage.toLowerCase().includes('thất bại')
  );
}

export function exportAccountsToCsv(accounts: ExternalAccountAdminItem[]): void {
  if (accounts.length === 0) {
    alert('Không có dữ liệu để xuất file');
    return;
  }

  const headers = [
    'STT',
    'Mã Sinh Viên',
    'Họ và Tên',
    'Lớp',
    'SĐT',
    'Hệ Thống',
    'URL',
    'Tên Đăng Nhập',
    'Mật Khẩu',
    'Token',
    'Trạng Thái',
    'Cập Nhật Lần Cuối',
  ];
  const rows = accounts.map((a, idx) => [
    idx + 1,
    a.username,
    `"${a.hoTen}"`,
    a.maLop,
    a.soDienThoai || '',
    `"${a.systemName}"`,
    a.systemUrl,
    a.extUsername,
    `"${a.extPassword || ''}"`,
    `"${a.token || ''}"`,
    a.status,
    a.updatedAt ? new Date(a.updatedAt).toLocaleString('vi-VN') : '',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Danh_sach_tai_khoan_lien_ket_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
