import { useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { openedFromRecovery, supabase } from '../lib/supabase';
import type { DB, Session } from './types';
import { iso, nowStamp } from '../lib/format';

// Client-side cache of everything the signed-in user may see. Row-level
// security on the server decides what that is (a customer sees only their own
// records; the owner sees everything). Writes go through server functions in
// actions.ts, then `reload()` refreshes the cache. A realtime subscription
// reloads when another device changes something.

type State = { ready: boolean; db: DB; session: Session; error: string; recovering: boolean };

export const emptyDB = (): DB => ({
  settings: { reminderDays: 28, cats: {} },
  customers: [], properties: [], appliances: [], jobs: [], quotes: [], docs: [],
  invoices: [], notifs: [], feed: [], reminders: [],
});

let state: State = { ready: false, db: emptyDB(), session: null, error: '', recovering: openedFromRecovery };
const listeners = new Set<() => void>();
const emit = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

// Opening a password-reset link signs the person in with a recovery session;
// send them to choose a new password before anything else.
supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') emit({ recovering: true });
});

/** Timestamptz → local "YYYY-MM-DDTHH:MM" (the app's stamp format). */
const stamp = (ts: string | null | undefined) => {
  if (!ts) return nowStamp();
  const d = new Date(ts);
  return iso(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
const day = (ts: string) => iso(new Date(ts));

async function fetchAll(): Promise<DB> {
  const q = <T,>(p: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) =>
    Promise.resolve(p).then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; });

  const [customers, properties, appliances, jobs, events, notes, quotes, invoices, payments, docs, notifs, activity, reminders, settings] = await Promise.all([
    q<any>(supabase.from('customers').select('*').order('created_at')),
    q<any>(supabase.from('properties').select('*').order('created_at')),
    q<any>(supabase.from('appliances').select('*').order('created_at')),
    q<any>(supabase.from('jobs').select('*').order('created_at', { ascending: false })),
    q<any>(supabase.from('job_events').select('*').order('created_at')),
    q<any>(supabase.from('job_notes').select('*').order('created_at')),
    q<any>(supabase.from('quotes').select('*').order('created_at')),
    q<any>(supabase.from('invoices').select('*').order('created_at')),
    q<any>(supabase.from('payments').select('*').order('created_at')),
    q<any>(supabase.from('documents').select('*').order('created_at')),
    q<any>(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)),
    q<any>(supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(30)),
    q<any>(supabase.from('reminders').select('*')),
    q<any>(supabase.from('settings').select('*').limit(1)),
  ]);

  const s = settings[0];
  return {
    settings: { reminderDays: s?.reminder_days ?? 28, cats: Object.fromEntries((s?.disabled_services ?? []).map((k: string) => [k, false])) },
    customers: customers.map(c => ({ id: c.id, name: c.name, first: c.first_name, last: c.last_name, email: c.email ?? '', phone: c.phone, type: c.type, pref: c.contact_pref, notify: c.notify })),
    properties: properties.map(p => ({ id: p.id, cid: p.customer_id, nick: p.nickname, addr: p.address, town: p.town, pc: p.postcode, ptype: p.property_type, rel: p.relationship, access: p.access_notes })),
    appliances: appliances.map(a => ({ id: a.id, pid: a.property_id, type: a.type, make: a.make, model: a.model, serial: a.serial, installed: a.installed_on ?? '', warranty: a.warranty_until ?? '', last: a.last_service ?? '', next: a.next_service ?? '', verified: a.verified })),
    jobs: jobs.map(j => ({
      id: j.id, ref: j.ref, cid: j.customer_id, pid: j.property_id, aid: j.appliance_id ?? '', svc: j.service, status: j.status,
      appt: j.appt_date ? { date: j.appt_date, slot: j.appt_slot } : null, eng: j.engineer, desc: j.description, pref: j.preferred_times,
      created: day(j.created_at), fault: j.fault_code, heating: j.heating_working, hot: j.hot_water_working, access: j.access_notes,
      files: j.photos, reschedPref: j.reschedule_pref, quote: j.quote_id ?? undefined, record: j.completion ?? undefined,
      notes: notes.filter(n => n.job_id === j.id).map(n => ({ at: stamp(n.created_at), t: n.body })),
      hist: events.filter(e => e.job_id === j.id).map(e => ({ at: stamp(e.created_at), t: e.body, int: e.internal })),
    })),
    quotes: quotes.map(x => ({
      id: x.id, ref: x.ref, jid: x.job_id, cid: x.customer_id, ver: x.version, status: x.status, issued: x.issued_on, expires: x.expires_on,
      vat: x.vat_rate, lines: x.lines, excl: x.exclusions, decision: x.decision ? { ...x.decision, at: stamp(x.decision.at) } : null,
    })),
    docs: docs.map(d => ({ id: d.id, cid: d.customer_id, pid: d.property_id ?? '', type: d.type, title: d.title, date: d.issued_on, jid: d.job_id ?? undefined, qid: d.quote_id ?? undefined, iid: d.invoice_id ?? undefined })),
    invoices: invoices.map(i => ({
      id: i.id, ref: i.ref, cid: i.customer_id, jid: i.job_id ?? '', date: i.issued_on, due: i.due_on, lines: i.lines, vat: i.vat_rate, paid: i.paid, status: i.status,
      payments: payments.filter(p => p.invoice_id === i.id).map(p => ({ amt: p.amount, method: p.method, at: p.paid_on })),
    })),
    notifs: notifs.map(n => ({ cid: n.customer_id, at: stamp(n.created_at), t: n.body, go: n.target, p: n.target_id ?? '' })),
    feed: activity.map(f => ({ at: stamp(f.created_at), t: f.body, jid: f.job_id ?? '' })),
    reminders: reminders.map(r => ({ aid: r.appliance_id, due: r.due, at: stamp(r.created_at), log: r.log })),
  };
}

let channel: RealtimeChannel | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function listen() {
  if (channel) return;
  channel = supabase
    .channel('stark-db')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => { reload().catch(() => {}); }, 300);
    })
    .subscribe();
}
function unlisten() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
}

/** Refresh the cache from the server. */
export async function reload() {
  if (!state.session) return;
  const db = await fetchAll();
  emit({ db, error: '' });
}

/** Work out which app the signed-in user gets, then load their records. */
async function enter(): Promise<Session> {
  const { data, error } = await supabase.rpc('whoami');
  if (error) throw new Error(error.message);
  if (!data) return null;
  const session: Session = data.role === 'owner' ? { role: 'owner' } : { role: 'customer', cid: data.cid };
  emit({ session });
  await reload();
  listen();
  return session;
}

export async function hydrate() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) await enter();
  } catch (e) {
    emit({ error: (e as Error).message });
  }
  emit({ ready: true });
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'That email and password don’t match an account.' : error.message);
  const session = await enter();
  if (!session) {
    await supabase.auth.signOut();
    throw new Error('Your account isn’t set up yet. Please call us.');
  }
  return session;
}

/** Set a new password from a reset link, then open the right app. */
export async function setNewPassword(password: string): Promise<Session> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('That reset link has expired or was already used. Please request a new one.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  const session = state.session ?? (await enter());
  emit({ recovering: false });
  return session;
}

export async function signOut() {
  unlisten();
  await supabase.auth.signOut();
  emit({ session: null, db: emptyDB(), recovering: false });
}

export const getDB = () => state.db;

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
export const useDB = () => useStore(s => s.db);
export const useSession = () => useStore(s => s.session);
export const useReady = () => useStore(s => s.ready);
export const useRecovering = () => useStore(s => s.recovering);
