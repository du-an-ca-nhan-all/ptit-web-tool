export function formatShortDate(date: string): string {
  return date.split('-').reverse().slice(0, 2).join('/');
}

export function clampPercentage(percentage: number): number {
  return Math.min(100, Math.max(0, percentage));
}
