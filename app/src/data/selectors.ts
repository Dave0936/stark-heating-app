import type { DB, Invoice, Job, Quote } from './types';
import { jobPill, pill, type PillProps } from './catalog';
import { totals } from './actions';
import { fd, fl, money } from '../lib/format';
import type { JobCardVM } from '../components/ui';

export function jobCard(db: DB, j: Job, side: 'c' | 'a'): JobCardVM {
  const p = db.properties.find(x => x.id === j.pid);
  const cu = db.customers.find(x => x.id === j.cid);
  return {
    ref: j.ref, svc: j.svc, who: cu?.name,
    place: (p?.nick ? p.nick + ' · ' : '') + (p?.town ?? ''),
    when: j.appt ? fd(j.appt.date) + ', ' + j.appt.slot : 'Date to be confirmed',
    pill: jobPill(j.status, side),
  };
}

export const lineRows = (lines: { d: string; q: number; u: number }[]) =>
  lines.map(l => ({ d: l.d, qty: l.q + ' × ' + money(l.u), amt: money(l.q * l.u) }));

export function invoiceVM(db: DB, i: Invoice) {
  const t = totals(i.lines, i.vat);
  const tone = ({ Paid: 'grey', Issued: 'blue', Overdue: 'red', 'Partially paid': 'dark', Draft: 'grey' } as const)[i.status] ?? 'grey';
  return {
    ref: i.ref, who: db.customers.find(c => c.id === i.cid)?.name ?? '', total: money(t.total), t,
    bal: i.status === 'Paid' ? 'Paid in full' : 'Balance ' + money(t.total - i.paid) + ' · due ' + fl(i.due),
    pill: pill(i.status, tone) as PillProps,
  };
}

export function ownerQuotePill(q: Quote): PillProps {
  const tone = ({ Issued: 'blue', Accepted: 'dark', Declined: 'grey', Superseded: 'grey', Draft: 'grey', Expired: 'grey' } as const)[q.status] ?? 'grey';
  return pill(q.status, tone);
}
export function customerQuotePill(q: Quote): PillProps {
  const m = { Issued: ['red', 'Awaiting your decision'], Accepted: ['blue', 'Accepted'], Declined: ['grey', 'Declined'], Superseded: ['grey', 'Superseded'], Expired: ['grey', 'Expired'], Draft: ['grey', 'Draft'] } as const;
  const [tone, text] = m[q.status] ?? ['grey', q.status];
  return pill(text, tone);
}
