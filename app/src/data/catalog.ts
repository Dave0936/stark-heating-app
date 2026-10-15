import type { ImageSourcePropType } from 'react-native';
import type { JobStatus } from './types';
import { C } from '../theme';

export const SLOTS = ['08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00'];
export const ENGINEERS = ['Craig Dunlop', 'Owner (you)'];

export type Category = { k: string; d: string; img?: ImageSourcePropType; featured?: boolean };
export const CATEGORIES: Category[] = [
  { k: 'Annual boiler service', d: 'Yearly service and safety checks', img: require('../../assets/images/service-boiler-service.jpg'), featured: true },
  { k: 'Boiler repair', d: 'Fault, error code or no heat', img: require('../../assets/images/service-boiler-repair.jpg'), featured: true },
  { k: 'New boiler installation', d: 'Free quotation', img: require('../../assets/images/service-new-boiler-installation.jpg'), featured: true },
  { k: 'Radiator replacement', d: 'Like-for-like or upgrade', img: { uri: 'https://images.unsplash.com/photo-1599028274511-e02a767949a3?crop=entropy&cs=tinysrgb&fit=crop&w=600&h=400&q=80' }, featured: true },
  { k: 'Boiler replacement', d: 'Swap an old or failing boiler' },
  { k: 'Central heating repair', d: 'Radiators, pipework, pumps' },
  { k: 'Heating controls', d: 'Thermostats and smart controls' },
  { k: 'Gas appliance servicing', d: 'Hobs, ovens and fires' },
  { k: 'Gas safety inspection enquiry', d: 'Including landlord checks' },
  { k: 'Other work', d: 'Tell us what you need' },
];
export const REPAIR_CATEGORIES = ['Boiler repair', 'Central heating repair'];

type Tone = 'red' | 'blue' | 'dark' | 'grey';
export const TONES: Record<Tone, [string, string]> = {
  red: [C.red, C.white], blue: [C.blue, C.white], dark: [C.ink, C.white], grey: [C.pressed, C.ink],
};

/** Owner-facing tone and customer-facing label for every job status. */
const STATUS: Record<JobStatus, [Tone, string]> = {
  'New request': ['red', 'Request received'],
  'Awaiting review': ['red', 'Awaiting confirmation'],
  'Awaiting quotation': ['red', 'Awaiting quotation'],
  'Quotation issued': ['blue', 'Quotation issued'],
  'Ready to schedule': ['red', 'Awaiting scheduling'],
  'Scheduled': ['blue', 'Confirmed'],
  'In progress': ['blue', 'In progress'],
  'Awaiting parts': ['dark', 'Awaiting parts'],
  'Reschedule requested': ['red', 'Reschedule requested'],
  'Cancellation requested': ['red', 'Cancellation requested'],
  'Follow-up required': ['red', "We'll be in touch"],
  'Completed': ['grey', 'Completed'],
  'Cancelled': ['grey', 'Cancelled'],
};
export const customerStatusLabel = (s: JobStatus) => STATUS[s]?.[1] ?? s;

export type PillProps = { text: string; bg: string; fg: string };
export function pill(text: string, tone: Tone): PillProps {
  return { text, bg: TONES[tone][0], fg: TONES[tone][1] };
}
/** Status pill for a job; the customer side softens red to grey except for quotes needing a decision. */
export function jobPill(status: JobStatus, side: 'c' | 'a'): PillProps {
  const st = STATUS[status] ?? (['grey', status] as [Tone, string]);
  let tone = st[0];
  if (side === 'c') tone = status === 'Quotation issued' ? 'red' : tone === 'blue' || tone === 'dark' ? tone : 'grey';
  return pill(side === 'c' ? st[1] : status, tone);
}

export const OPEN = (s: JobStatus) => s !== 'Completed' && s !== 'Cancelled';
export const NEEDS_ACTION: JobStatus[] = ['New request', 'Awaiting review', 'Ready to schedule', 'Reschedule requested', 'Cancellation requested', 'Awaiting quotation', 'Follow-up required'];
