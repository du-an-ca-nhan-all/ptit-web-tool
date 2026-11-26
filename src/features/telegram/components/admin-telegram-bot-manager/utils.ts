import { LoginUser } from '../../../../types';
import { parseTelegramInput } from '../../utils/telegramParser';
import { SubscriberFilterStatus, SubscriberItem } from './types';

export function isAdminUser(currentUser: LoginUser): boolean {
  return Boolean(
    currentUser?.activeRole === 'admin' ||
      (currentUser?.isAdmin &&
        currentUser?.activeRole !== 'sinh_vien' &&
        currentUser?.activeRole !== 'lop_truong') ||
      (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );
}

export function filterSubscribersList(
  subscribers: SubscriberItem[],
  searchQuery: string,
  filterStatus: SubscriberFilterStatus
): SubscriberItem[] {
  return subscribers.filter((sub) => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      sub.username.toLowerCase().includes(query) ||
      sub.fullName.toLowerCase().includes(query) ||
      sub.maLop.toLowerCase().includes(query) ||
      sub.chatId.toLowerCase().includes(query) ||
      (sub.botUsername && sub.botUsername.toLowerCase().includes(query));

    let matchFilter = true;
    if (filterStatus === 'ACTIVE') matchFilter = sub.isEnabled;
    if (filterStatus === 'INACTIVE') matchFilter = !sub.isEnabled;
    if (filterStatus === 'CUSTOM') matchFilter = sub.isCustomBot;
    if (filterStatus === 'SYSTEM') matchFilter = !sub.isCustomBot;

    return matchSearch && matchFilter;
  });
}

export function applyTelegramChatInput(
  val: string,
  setChatId: (value: string) => void,
  setThreadId: (value: string) => void
): void {
  const parsed = parseTelegramInput(val);
  if (parsed.isLink && parsed.chatId) {
    setChatId(parsed.chatId);
    if (parsed.threadId) setThreadId(parsed.threadId);
  } else if (parsed.username && parsed.isLink) {
    setChatId(parsed.username);
    if (parsed.threadId) setThreadId(parsed.threadId);
  } else {
    setChatId(val);
  }
}
