// Date and money helpers. Dates are stored as ISO "YYYY-MM-DD" strings and
// timestamps as "YYYY-MM-DDTHH:MM". Formatting is done by hand rather than
// with Intl so output is identical on Hermes, iOS, Android and web.

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Parse an ISO date at local noon so DST shifts never change the day. */
export function D(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}
export function iso(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
export function todayIso(): string {
  return iso(new Date());
}
export function addDays(s: string, n: number): string {
  const d = D(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function diffDays(a: string, b: string): number {
  return Math.round((D(b).getTime() - D(a).getTime()) / 864e5);
}
export function isWeekend(s: string): boolean {
  const w = D(s).getDay();
  return w === 0 || w === 6;
}
/** The next `n` weekdays after `from` (or starting at `from` when `inclusive`). */
export function weekdays(from: string, n: number, inclusive = false): string[] {
  const out: string[] = [];
  let d = inclusive ? from : addDays(from, 1);
  while (out.length < n) {
    if (!isWeekend(d)) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

/** "Wed 14 Oct" */
export function fd(s: string): string {
  const d = D(s);
  return DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MON_SHORT[d.getMonth()];
}
/** "14 Oct 2026", or an em dash when empty. */
export function fl(s?: string | null): string {
  if (!s) return '—';
  const d = D(s);
  return d.getDate() + ' ' + MON_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}
/** "Wednesday 14 October" */
export function fLong(s: string): string {
  const d = D(s);
  return DOW_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MON_LONG[d.getMonth()];
}
export function dowShort(s: string): string {
  return DOW_SHORT[D(s).getDay()];
}

/** Current local time as "YYYY-MM-DDTHH:MM". */
export function nowStamp(): string {
  const d = new Date();
  return iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
/** "14 Oct 2026, 09:12" */
export function fStamp(stamp: string): string {
  return fl(stamp.slice(0, 10)) + (stamp.length > 10 ? ', ' + stamp.slice(11, 16) : '');
}

/** Pence to "£1,234.56". */
export function money(p: number): string {
  const neg = p < 0;
  const abs = Math.abs(Math.round(p));
  const pounds = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + '£' + pounds + '.' + pad(abs % 100);
}
