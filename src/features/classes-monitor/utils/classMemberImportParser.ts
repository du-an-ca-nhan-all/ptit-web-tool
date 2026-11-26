import Papa from 'papaparse';
import type { ParseClassMembersResult } from './class-member-import-parser/types';
import { MA_SV_REGEX } from './class-member-import-parser/normalize';
import { parseRows } from './class-member-import-parser/parseRows';

export type { ImportClassMemberRow, ParseClassMembersResult } from './class-member-import-parser/types';
export { splitVietnameseFullName } from './class-member-import-parser/normalize';
export { downloadClassMembersSampleCsv } from './class-member-import-parser/sampleCsv';

export function parseClassMembersText(text: string): ParseClassMembersResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { items: [], duplicateCount: 0, skippedCount: 0 };
  }

  const parsed = Papa.parse(trimmed, { skipEmptyLines: true });
  const rawRows = (parsed.data as unknown[][]) || [];

  const expandedRows: unknown[][] = [];
  rawRows.forEach((row) => {
    if (row.length === 1 && typeof row[0] === 'string') {
      const cell = row[0].trim();
      if (cell.includes(',') || cell.includes(';') || cell.includes('\t')) {
        const parts = cell
          .split(/[,;\t]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 1 && parts.every((p) => MA_SV_REGEX.test(p))) {
          parts.forEach((id) => expandedRows.push([id]));
          return;
        }
        expandedRows.push(parts);
        return;
      }
      expandedRows.push([cell]);
      return;
    }
    expandedRows.push(row);
  });

  return parseRows(expandedRows);
}

export function parseClassMembersFile(file: File): Promise<ParseClassMembersResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors?.length > 0 && (!results.data || results.data.length === 0)) {
          resolve({
            items: [],
            duplicateCount: 0,
            skippedCount: 0,
            error: 'Không thể đọc file CSV. Vui lòng kiểm tra lại định dạng file.',
          });
          return;
        }
        resolve(parseRows(results.data as unknown[][]));
      },
      error: (err) => {
        resolve({
          items: [],
          duplicateCount: 0,
          skippedCount: 0,
          error: `Lỗi đọc file: ${err.message}`,
        });
      },
    });
  });
}
