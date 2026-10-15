import type { DB, Job } from './types';
import { NEEDS_ACTION } from './catalog';
import { totals } from './actions';
import { diffDays, todayIso } from '../lib/format';

/** Owner job filters, in display order. */
export const JOB_FILTERS: Record<string, (j: Job) => boolean> = {
  'Needs Action': j => NEEDS_ACTION.includes(j.status),
  'Scheduled': j => j.status === 'Scheduled',
  'In Progress': j => j.status === 'In progress',
  'Awaiting Parts': j => j.status === 'Awaiting parts',
  'Quotes': j => ['Awaiting quotation', 'Quotation issued'].includes(j.status),
  'Completed': j => j.status === 'Completed',
  'All': () => true,
};

export function ownerStats(db: DB) {
  const T = todayIso();
  const rd = db.settings.reminderDays;
  const due = db.appliances.filter(x => x.next && diffDays(T, x.next) <= rd);
  const unpaid = db.invoices.filter(i => ['Issued', 'Overdue', 'Partially paid'].includes(i.status));
  const balance = unpaid.reduce((t, i) => t + totals(i.lines, i.vat).total - i.paid, 0);
  const todays = db.jobs.filter(j => j.appt && j.appt.date === T && j.status !== 'Cancelled').sort((x, y) => x.appt!.slot.localeCompare(y.appt!.slot));
  const count = (f: string) => db.jobs.filter(JOB_FILTERS[f]).length;
  return { T, rd, due, unpaid, balance, todays, count };
}
