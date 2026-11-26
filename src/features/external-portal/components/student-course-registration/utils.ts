export function filterRegisteredCourses(courses: any[], searchQuery: string): any[] {
  return courses.filter((item) => {
    const toHoc = item.to_hoc || item || {};
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const maMon = String(toHoc.ma_mon || item.ma_mon || '').toLowerCase();
    const tenMon = String(toHoc.ten_mon || item.ten_mon || '').toLowerCase();
    const nhomTo = String(toHoc.nhom_to || item.nhom_to || '').toLowerCase();
    const lop = String(toHoc.lop || item.lop || '').toLowerCase();
    const tkb = String(toHoc.tkb || item.tkb || '').toLowerCase();
    const gv = String(toHoc.gv || item.gv || '').toLowerCase();

    return (
      maMon.includes(query) ||
      tenMon.includes(query) ||
      nhomTo.includes(query) ||
      lop.includes(query) ||
      tkb.includes(query) ||
      gv.includes(query)
    );
  });
}
