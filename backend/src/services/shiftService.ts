export function getCurrentShift(): string {
  const now = new Date();
  const utcMinus3 = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const hour = utcMinus3.getUTCHours();
  if (hour >= 23 || hour < 7) return 'A';
  if (hour >= 7 && hour < 15) return 'B';
  return 'C';
}
