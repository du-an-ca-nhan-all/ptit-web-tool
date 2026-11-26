export interface PreviewDroppedStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  soDienThoai: string;
  isMonitor: boolean;
}

export interface PreviewTransferredStudent {
  maSV: string;
  hoTen: string;
  fromClass: string;
  previousStatus: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface PreviewRestoredStudent {
  maSV: string;
  hoTen: string;
  previousStatus: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface PreviewNewStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  soDienThoai: string;
}

export interface PreviewUnchangedStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface ClassMemberImportPreview {
  classCode: string;
  currentActiveCount: number;
  importedCount: number;
  expectedActiveCountAfter: number;
  droppedOut: PreviewDroppedStudent[];
  transferred: PreviewTransferredStudent[];
  restored: PreviewRestoredStudent[];
  newStudents: PreviewNewStudent[];
  unchanged: PreviewUnchangedStudent[];
  hasMonitorInDroppedOut: boolean;
}

export interface StudentProfileUpdates {
  hoLot?: string;
  ten?: string;
  hoTen?: string;
  gioiTinh?: string;
  ngaySinh?: string;
  soDienThoai?: string;
}
