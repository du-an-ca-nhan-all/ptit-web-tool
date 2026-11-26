export interface RoomCondition {
  maMH: string;
  mapThi: string;
  ngayThi: string;
  gioThi: string;
}

export function normalizeCode(value?: string | null): string {
  return String(value || '').trim().toUpperCase();
}

export function makeRoomKey(
  maMH: string,
  mapThi: string,
  ngayThi: string,
  gioThi: string
): string {
  return [
    normalizeCode(maMH),
    normalizeCode(mapThi),
    String(ngayThi || '').trim(),
    String(gioThi || '').trim(),
  ].join('|');
}

export function resolveReferenceMaSV(params: {
  requestedRefMaSV: string;
  isMonitor: boolean;
  userClass: string;
  classCode: string;
  username?: string | null;
  classMonitors: Array<{ username: string | null }>;
}): string {
  let referenceMaSV = params.requestedRefMaSV;

  if (!referenceMaSV) {
    if (params.isMonitor && params.userClass === params.classCode && params.username) {
      referenceMaSV = normalizeCode(params.username);
    } else if (params.classMonitors.length > 0) {
      referenceMaSV = normalizeCode(params.classMonitors[0].username);
    } else if (params.username) {
      referenceMaSV = normalizeCode(params.username);
    }
  }

  return referenceMaSV;
}

export function collectUniqueRooms(
  records: Array<{
    maMH?: string | null;
    mapThi?: string | null;
    ngayThi?: string | null;
    gioThi?: string | null;
  }>
): Map<string, RoomCondition> {
  const uniqueRooms = new Map<string, RoomCondition>();

  for (const rec of records) {
    if (!rec.maMH || !rec.mapThi || !rec.ngayThi) continue;
    const key = makeRoomKey(rec.maMH, rec.mapThi, rec.ngayThi, rec.gioThi || '');
    if (!uniqueRooms.has(key)) {
      uniqueRooms.set(key, {
        maMH: rec.maMH,
        mapThi: rec.mapThi,
        ngayThi: rec.ngayThi,
        gioThi: rec.gioThi || '',
      });
    }
  }

  return uniqueRooms;
}

export function buildRoomTotalMap(
  roomRows: Array<{
    maMH?: string | null;
    mapThi?: string | null;
    ngayThi?: string | null;
    gioThi?: string | null;
    maSV?: string | null;
  }>
): Map<string, Set<string>> {
  const roomTotalMap = new Map<string, Set<string>>();

  for (const row of roomRows) {
    const key = makeRoomKey(
      row.maMH || '',
      row.mapThi || '',
      row.ngayThi || '',
      row.gioThi || ''
    );
    const stId = normalizeCode(row.maSV);
    if (!stId) continue;
    if (!roomTotalMap.has(key)) {
      roomTotalMap.set(key, new Set());
    }
    roomTotalMap.get(key)!.add(stId);
  }

  return roomTotalMap;
}
