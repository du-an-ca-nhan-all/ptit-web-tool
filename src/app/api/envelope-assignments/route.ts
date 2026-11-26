import { NextRequest, NextResponse } from 'next/server';
import { fetchEnvelopeConfirmationRecords, mapRecordsToAssignments } from './route/mappers';
import { handlePostEnvelopeAssignment } from './route/postHandler';
import { handleDeleteEnvelopeAssignment } from './route/deleteHandler';

export type { EnvelopeAssignment } from './route/types';

// GET /api/envelope-assignments
// Lấy danh sách tất cả các phòng thi đã được xác nhận đi phong bì từ bảng RoomEnvelopeConfirmation
export async function GET() {
  try {
    const records = await fetchEnvelopeConfirmationRecords();
    const assignments = mapRecordsToAssignments(records, true);

    return NextResponse.json({
      success: true,
      assignments,
      list: records,
    });
  } catch (error: any) {
    console.error('Error fetching envelope assignments from RoomEnvelopeConfirmation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/envelope-assignments
// Xác nhận nhận đi phong bì cho phòng thi, cho phép gán sinh viên hỗ trợ
export async function POST(req: NextRequest) {
  return handlePostEnvelopeAssignment(req);
}

// DELETE /api/envelope-assignments
// Hủy xác nhận phụ trách nước trong bảng RoomEnvelopeConfirmation
export async function DELETE(req: NextRequest) {
  return handleDeleteEnvelopeAssignment(req);
}
