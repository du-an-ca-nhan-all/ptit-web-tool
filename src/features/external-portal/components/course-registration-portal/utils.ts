import { CourseStatusFilter, GroupedSubject } from './types';

export function buildRegisteredSubjectCodeMap(dsKqdkmh: any[]): Map<string, string> {
  const map = new Map<string, string>(); // maMon -> nhomTo
  (dsKqdkmh || []).forEach((item: any) => {
    if (item.to_hoc?.ma_mon) {
      map.set(item.to_hoc.ma_mon.toUpperCase(), item.to_hoc.nhom_to || 'Đã ĐK');
    }
  });
  return map;
}

export interface GroupAndFilterOpenCoursesParams {
  dsNhomTo: any[];
  searchQuery: string;
  statusFilter: CourseStatusFilter;
  registeredSubjectCodeMap: Map<string, string>;
}

export function groupAndFilterOpenCourses({
  dsNhomTo,
  searchQuery,
  statusFilter,
  registeredSubjectCodeMap,
}: GroupAndFilterOpenCoursesParams): GroupedSubject[] {
  const groups = dsNhomTo || [];
  const query = searchQuery.trim().toLowerCase();

  // Map: ma_mon -> { ma_mon, ten_mon, so_tc, groups: [] }
  const map: Record<string, GroupedSubject> = {};

  groups.forEach((g) => {
    const maMon = (g.ma_mon || 'OTHER').toUpperCase();
    if (!map[maMon]) {
      map[maMon] = {
        ma_mon: maMon,
        ten_mon: g.ten_mon || maMon,
        so_tc: g.so_tc || g.so_tc_hp || 0,
        groups: [],
      };
    }
    map[maMon].groups.push(g);
  });

  // Filter by query and statusFilter
  return Object.values(map).filter((subj) => {
    const isSubjMatch =
      !query ||
      subj.ma_mon.toLowerCase().includes(query) ||
      subj.ten_mon.toLowerCase().includes(query) ||
      subj.groups.some(
        (g) =>
          (g.nhom_to && g.nhom_to.toLowerCase().includes(query)) ||
          (g.lop && g.lop.toLowerCase().includes(query)) ||
          (g.tkb && g.tkb.toLowerCase().includes(query)) ||
          (g.id_to_hoc && String(g.id_to_hoc).includes(query))
      );

    if (!isSubjMatch) return false;

    // Status filter
    if (statusFilter === 'AVAILABLE') {
      return subj.groups.some((g) => g.enable && g.sl_cl > 0);
    }
    if (statusFilter === 'FULL') {
      return subj.groups.every((g) => g.sl_cl <= 0 || !g.enable);
    }
    if (statusFilter === 'REGISTERED') {
      return registeredSubjectCodeMap.has(subj.ma_mon);
    }

    return true;
  });
}

export interface FilterFlatOpenCoursesParams {
  dsNhomTo: any[];
  searchQuery: string;
  statusFilter: CourseStatusFilter;
  registeredSubjectCodeMap: Map<string, string>;
}

export function filterFlatOpenCourses({
  dsNhomTo,
  searchQuery,
  statusFilter,
  registeredSubjectCodeMap,
}: FilterFlatOpenCoursesParams): any[] {
  const groups = dsNhomTo || [];
  const query = searchQuery.trim().toLowerCase();

  return groups.filter((g) => {
    const matchesQuery =
      !query ||
      (g.ma_mon && g.ma_mon.toLowerCase().includes(query)) ||
      (g.ten_mon && g.ten_mon.toLowerCase().includes(query)) ||
      (g.nhom_to && g.nhom_to.toLowerCase().includes(query)) ||
      (g.lop && g.lop.toLowerCase().includes(query)) ||
      (g.tkb && g.tkb.toLowerCase().includes(query)) ||
      (g.id_to_hoc && String(g.id_to_hoc).includes(query));

    if (!matchesQuery) return false;

    if (statusFilter === 'AVAILABLE') return g.enable && g.sl_cl > 0;
    if (statusFilter === 'FULL') return g.sl_cl <= 0 || !g.enable;
    if (statusFilter === 'REGISTERED') return registeredSubjectCodeMap.has(g.ma_mon?.toUpperCase());

    return true;
  });
}
