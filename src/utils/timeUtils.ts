export function isExpired(date: string, time: string): boolean {
  const tripDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const twelveHoursAfter = new Date(tripDateTime.getTime() + (12 * 60 * 60 * 1000));
  
  return now > twelveHoursAfter;
}

export function formatDateTime(date: string, time: string): string {
  const dateTime = new Date(`${date}T${time}`);
  return dateTime.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}