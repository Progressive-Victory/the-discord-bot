// milliseconds in a day
const _MS_PER_DAY = 1000 * 60 * 60 * 24;

export const WARN_MAX_CHAR = 2000;

/**
 * Find the difference in days between two date Objects
 * @param a - smaller date
 * @param b - larger date
 * @returns number of days
 */
export function dateDiffInDays(a: Date, b: Date): number {
  // converting dates to number of milliseconds between midnight, January 1, 1970 Universal Coordinated Time and the specified date
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  // find the deference in days
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
