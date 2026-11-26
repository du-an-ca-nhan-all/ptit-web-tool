export interface ImportClassMemberRow {
  maSV: string;
  hoLot?: string;
  ten?: string;
  hoTen?: string;
  gioiTinh?: string;
  ngaySinh?: string;
  soDienThoai?: string;
  ghiChu?: string;
}

export interface ParseClassMembersResult {
  items: ImportClassMemberRow[];
  duplicateCount: number;
  skippedCount: number;
  error?: string;
}

export interface ColumnMapping {
  maSV: number;
  hoLot: number;
  ten: number;
  hoTen: number;
  gioiTinh: number;
  ngaySinh: number;
  soDienThoai: number;
  ghiChu: number;
}
