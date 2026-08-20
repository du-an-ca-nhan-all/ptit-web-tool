/**
 * Client-side CSV / TSV / Data export utility with UTF-8 BOM support (for Excel compatibility in Vietnamese)
 */

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T, index: number) => any);
}

export function exportToCsv<T>(filename: string, data: T[], columns: ExportColumn<T>[]) {
  if (typeof window === 'undefined' || !data || data.length === 0) return;

  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

  const rows = data.map((item, index) => {
    return columns
      .map((col) => {
        let val: any = '';
        if (typeof col.accessor === 'function') {
          val = col.accessor(item, index);
        } else {
          val = item[col.accessor];
        }
        if (val === null || val === undefined) val = '';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
