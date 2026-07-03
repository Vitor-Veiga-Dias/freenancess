const BRAZIL_UTC_OFFSET_HOURS = 3;

export function normalizePostedAt(value: string | Date): Date {
  const iso = typeof value === "string" ? value : value.toISOString();
  const datePart = iso.slice(0, 10);

  return new Date(`${datePart}T12:00:00.000Z`);
}

export function getMonthBounds(month: string): { start: Date; end: Date } {
  const [year, monthIndex] = month.split("-").map(Number);

  return {
    start: new Date(
      Date.UTC(year, monthIndex - 1, 1, BRAZIL_UTC_OFFSET_HOURS, 0, 0, 0),
    ),
    end: new Date(
      Date.UTC(year, monthIndex, 1, BRAZIL_UTC_OFFSET_HOURS, 0, 0, 0),
    ),
  };
}

export function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function getCalendarMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function matchesMonthKey(postedAt: Date, month: string): boolean {
  return (
    getCalendarMonthKey(postedAt) === month ||
    formatMonthKey(postedAt) === month
  );
}
