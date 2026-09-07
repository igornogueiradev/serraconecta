export function isExpired(date: string | null | undefined, time: string | null | undefined): boolean {
  if (!date || !time) return false;
  const tripDateTime = new Date(`${date}T${time}`);
  if (isNaN(tripDateTime.getTime())) return false;
  const twelveHoursAfter = new Date(tripDateTime.getTime() + (12 * 60 * 60 * 1000));
  return new Date() > twelveHoursAfter;
}

export function formatDateTime(date: string | null | undefined, time: string | null | undefined): string {
  if (!date || !time) return '—';
  const dateTime = new Date(`${date}T${time}`);
  if (isNaN(dateTime.getTime())) return '—';
  return dateTime.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
