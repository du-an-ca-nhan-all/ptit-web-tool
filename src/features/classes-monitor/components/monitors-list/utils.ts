import { LoginUser } from '../../types/class.types';

export function isMonitorUser(user: LoginUser): boolean {
  return Boolean(
    user.role === 'lop_truong' ||
    (user.role && user.role.includes('lop_truong')) ||
    user.isMonitor
  );
}

export function filterMonitors(monitors: LoginUser[], searchQuery: string): LoginUser[] {
  if (!searchQuery.trim()) return monitors;
  const q = searchQuery.trim().toLowerCase();
  return monitors.filter((m) => {
    const name = (m.fullName || '').toLowerCase();
    const user = (m.username || '').toLowerCase();
    const lop = (m.lop || '').toLowerCase();
    const phone = (m.phoneNumber || '').toLowerCase();
    return name.includes(q) || user.includes(q) || lop.includes(q) || phone.includes(q);
  });
}

export function buildPageNumbers(totalPages: number, validPage: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (validPage > 3) pages.push('...');
    const start = Math.max(2, validPage - 1);
    const end = Math.min(totalPages - 1, validPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (validPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}
