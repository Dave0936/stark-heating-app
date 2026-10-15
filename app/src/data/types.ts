export type JobStatus =
  | 'New request' | 'Awaiting review' | 'Awaiting quotation' | 'Quotation issued' | 'Ready to schedule'
  | 'Scheduled' | 'In progress' | 'Awaiting parts' | 'Reschedule requested' | 'Cancellation requested'
  | 'Follow-up required' | 'Completed' | 'Cancelled';

export type ContactPref = 'Email' | 'Phone' | 'SMS';
export type Notify = { email: boolean; sms: boolean; push: boolean };

export type Customer = {
  id: string; name: string; first: string; last: string; email: string; phone: string;
  type: 'Residential' | 'Landlord'; pref: ContactPref; notify: Notify;
};
export type Property = {
  id: string; cid: string; nick: string; addr: string; town: string; pc: string;
  ptype: string; rel: string; access: string;
};
export type Appliance = {
  id: string; pid: string; type: string; make: string; model: string; serial: string;
  installed: string; warranty: string; last: string; next: string; verified: boolean;
};
export type HistEntry = { at: string; t: string; int?: boolean };
export type Note = { at: string; t: string };
export type CompletionRecord = { summary: string; findings: string; recs: string; hours?: string; date: string; eng: string };
export type Job = {
  id: string; ref: string; cid: string; pid: string; aid: string; svc: string; status: JobStatus;
  appt: { date: string; slot: string } | null; eng: string; desc: string; pref: string; created: string;
  fault?: string; heating?: string; hot?: string; access?: string; files?: string[];
  reschedPref?: string; quote?: string; record?: CompletionRecord;
  notes: Note[]; hist: HistEntry[];
};
export type Line = { d: string; q: number; u: number }; // u = unit price in pence
export type QuoteStatus = 'Draft' | 'Issued' | 'Accepted' | 'Declined' | 'Superseded' | 'Expired';
export type Quote = {
  id: string; ref: string; jid: string; cid: string; ver: number; status: QuoteStatus;
  issued: string; expires: string; vat: number; lines: Line[]; excl: string[];
  decision: { d: 'Accepted' | 'Declined'; by: string; at: string; ver: number } | null;
};
export type Doc = {
  id: string; cid: string; pid: string; type: string; title: string; date: string;
  jid?: string; qid?: string; iid?: string;
};
export type InvoiceStatus = 'Draft' | 'Issued' | 'Overdue' | 'Partially paid' | 'Paid';
export type Invoice = {
  id: string; ref: string; cid: string; jid: string; date: string; due: string; lines: Line[]; vat: number;
  paid: number; status: InvoiceStatus; payments: { amt: number; method: string; at: string }[];
};
export type NotifTarget = 'quote' | 'doc' | 'job' | 'book' | '';
export type Notif = { cid: string; at: string; t: string; go: NotifTarget; p: string };
export type FeedItem = { at: string; t: string; jid: string };
export type Reminder = { aid: string; due: string; at: string; log: string };

export type DB = {
  settings: { reminderDays: number; cats: Record<string, boolean> };
  customers: Customer[]; properties: Property[]; appliances: Appliance[]; jobs: Job[];
  quotes: Quote[]; docs: Doc[]; invoices: Invoice[]; notifs: Notif[]; feed: FeedItem[]; reminders: Reminder[];
};

export type Role = 'customer' | 'owner';
export type Session = { role: Role; cid?: string } | null;
