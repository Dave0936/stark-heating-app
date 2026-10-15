import { router } from 'expo-router';
import { useDB, useSession } from './store';
import type { DB } from './types';

/** The signed-in customer and their slice of the shared records. */
export function useCustomer() {
  const db = useDB();
  const session = useSession();
  const cid = session?.cid ?? 'c1';
  return { db, cid, ...customerSlice(db, cid) };
}

export function customerSlice(db: DB, cid: string) {
  const me = db.customers.find(c => c.id === cid)!;
  const props = db.properties.filter(p => p.cid === cid);
  const pids = props.map(p => p.id);
  const apps = db.appliances.filter(a => pids.includes(a.pid));
  const jobs = db.jobs.filter(j => j.cid === cid).sort((a, b) => b.created.localeCompare(a.created));
  return { me, props, apps, jobs };
}

/** Open the request-a-service flow, optionally with a service preselected. */
export const startBooking = (cat = '') => router.push({ pathname: '/customer/book', params: { cat } } as never);
