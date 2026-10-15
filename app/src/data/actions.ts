import type { ContactPref, DB, Job, JobStatus, Line, Notify, Property, Quote } from './types';
import { supabase } from '../lib/supabase';
import { reload } from './store';
import { addDays, todayIso } from '../lib/format';

// Every change goes through a server function (supabase/migrations) that checks
// the caller's role and the record's status, and writes the history,
// notifications and activity feed in the same transaction. Each action
// rejects with a message that's safe to show the user.

export function totals(lines: Line[], vat: number) {
  const sub = lines.reduce((t, l) => t + l.q * l.u, 0);
  const v = Math.round((sub * vat) / 100);
  return { sub, v, total: sub + v };
}

async function call<T = void>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  await reload().catch(() => {});
  return data as T;
}

// ---------- customer ----------

export type BookingDraft = {
  pid: string; cat: string; aid: string; desc: string; fault: string;
  heating: string; hot: string; pref: string; access: string; files: string[];
};

export const submitBooking = (b: BookingDraft) =>
  call<{ id: string; ref: string }>('submit_booking', {
    p_property: b.pid, p_service: b.cat, p_appliance: b.aid && b.aid !== 'none' ? b.aid : null, p_description: b.desc,
    p_fault: b.fault, p_heating: b.heating, p_hot: b.hot, p_pref: b.pref, p_access: b.access, p_photos: b.files,
  });

export const requestCancellation = (jid: string) => call('request_cancellation', { p_job: jid });
export const requestReschedule = (jid: string, pref: string) => call('request_reschedule', { p_job: jid, p_pref: pref });
export const decideQuote = (qid: string, decision: 'Accepted' | 'Declined') => call('decide_quote', { p_quote: qid, p_decision: decision });

export async function addProperty(p: Omit<Property, 'id'>) {
  const { error } = await supabase.from('properties').insert({
    customer_id: p.cid, nickname: p.nick, address: p.addr, town: p.town, postcode: p.pc,
    property_type: p.ptype, relationship: p.rel, access_notes: p.access,
  });
  if (error) throw new Error(error.message);
  await reload().catch(() => {});
}

export async function saveProfile(cid: string, p: { first: string; last: string; phone: string; pref: ContactPref; notify: Notify }) {
  const { error } = await supabase.from('customers')
    .update({ first_name: p.first.trim(), last_name: p.last.trim(), phone: p.phone.trim(), contact_pref: p.pref, notify: p.notify })
    .eq('id', cid);
  if (error) throw new Error(error.message);
  await reload().catch(() => {});
}

// ---------- owner ----------

export const setJobStatus = (jid: string, status: JobStatus, text: string) => call('set_job_status', { p_job: jid, p_status: status, p_text: text });
export const scheduleJob = (jid: string, date: string, slot: string, eng: string) => call('schedule_job', { p_job: jid, p_date: date, p_slot: slot, p_engineer: eng });
export const addNote = (jid: string, text: string) => call('add_job_note', { p_job: jid, p_body: text });

export const completeJob = (jid: string, r: { summary: string; findings: string; recs: string; hours?: string }, nextDue: string | null) =>
  call('complete_job', { p_job: jid, p_summary: r.summary, p_findings: r.findings, p_recs: r.recs, p_hours: r.hours ?? '', p_next_due: nextDue });

export const issueQuote = (jid: string, base: Quote | null, q: { lines: Line[]; vat: number; expires: string; excl: string[] }) =>
  call<string>('issue_quote', { p_job: jid, p_base: base?.id ?? null, p_lines: q.lines, p_vat: q.vat, p_expires: q.expires, p_exclusions: q.excl });

export const recordPayment = (iid: string, amt: number, method: string) => call('record_payment', { p_invoice: iid, p_amount: amt, p_method: method });
export const sendReminder = (aid: string) => call('send_service_reminder', { p_appliance: aid });

async function updateSettings(patch: Record<string, unknown>) {
  const { error } = await supabase.from('settings').update(patch).eq('id', true);
  if (error) throw new Error(error.message);
  await reload().catch(() => {});
}
export const setReminderDays = (db: DB, delta: number) =>
  updateSettings({ reminder_days: Math.min(56, Math.max(7, db.settings.reminderDays + delta)) });
export function toggleCategory(db: DB, k: string) {
  const disabled = Object.keys(db.settings.cats).filter(c => db.settings.cats[c] === false);
  return updateSettings({ disabled_services: disabled.includes(k) ? disabled.filter(c => c !== k) : disabled.concat(k) });
}

/** Another open job already holding this engineer, date and slot (the server enforces this too). */
export function slotTaken(db: DB, jid: string, date: string, slot: string, eng: string): Job | undefined {
  return db.jobs.find(o => o.id !== jid && o.appt && o.appt.date === date && o.appt.slot === slot && o.eng === eng && !['Cancelled', 'Completed'].includes(o.status));
}

export const defaultExpiry = () => addDays(todayIso(), 30);
