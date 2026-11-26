/**
 * Clean and format error messages from Telegram API to friendly Vietnamese descriptions
 */
export function formatTelegramError(description: string, errorCode?: number): string {
  const desc = description.toLowerCase();

  if (desc.includes('unauthorized') || errorCode === 401) {
    return 'Bot Token không hợp lệ. Vui lòng kiểm tra lại token được cấp bởi @BotFather.';
  }
  if (desc.includes('bot was blocked by the user') || desc.includes('user is deactivated')) {
    return 'Bot đã bị người dùng chặn hoặc bạn chưa bấm nút "Start" (/start) với Bot trên Telegram.';
  }
  if (desc.includes('chat not found')) {
    return 'Không tìm thấy Chat ID. Vui lòng kiểm tra lại ID hoặc đảm bảo bạn đã gửi tin nhắn /start cho Bot trước.';
  }
  if (desc.includes('message thread not found') || desc.includes('thread not found') || desc.includes('topic not found')) {
    return 'Không tìm thấy Thread ID (Topic). Vui lòng kiểm tra lại Thread ID trong nhóm siêu nhóm (supergroup topic).';
  }
  if (desc.includes('bot is not a member of the group chat') || desc.includes('bot is not a member')) {
    return 'Bot chưa được thêm vào Nhóm chat. Vui lòng thêm Bot vào nhóm và cấp quyền gửi tin nhắn.';
  }
  if (desc.includes('bot is not an administrator') || desc.includes('not enough rights')) {
    return 'Bot chưa có đủ quyền quản trị viên trong Kênh/Nhóm để gửi tin nhắn.';
  }
  if (desc.includes('can\'t parse entities') || desc.includes('parse mode')) {
    return 'Lỗi định dạng nội dung tin nhắn HTML/Markdown.';
  }

  return description || `Lỗi Telegram API (Mã lỗi: ${errorCode || 'Unknown'})`;
}
