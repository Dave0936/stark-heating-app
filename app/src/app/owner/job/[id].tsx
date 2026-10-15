import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Card, Checkbox, Chips, ErrorBox, Field, Input, KVRows, LinkBtn, Pill, Screen, Section, T, Tap } from '../../../components/ui';
import { DateField } from '../../../components/DateField';
import { confirm, run, toast } from '../../../components/overlay';
import { useDB } from '../../../data/store';
import { ENGINEERS, jobPill, SLOTS } from '../../../data/catalog';
import { addNote, completeJob, scheduleJob, setJobStatus, slotTaken } from '../../../data/actions';
import type { JobStatus } from '../../../data/types';
import { addDays, fd, fl, fStamp, todayIso, weekdays } from '../../../lib/format';
import { C, tel } from '../../../theme';

type Sched = { date: string; slot: string; eng: string; err: string };
type Complete = { summary: string; findings: string; recs: string; hours: string; nextDue: string; sign: boolean; err: string };

export default function OwnerJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const [sc, setSc] = useState<Sched | null>(null);
  const [cf, setCf] = useState<Complete | null>(null);
  const [note, setNote] = useState('');

  const j = db.jobs.find(x => x.id === id);
  if (!j) return <Screen><T>This job no longer exists.</T></Screen>;
  const cu = db.customers.find(c => c.id === j.cid)!;
  const p = db.properties.find(x => x.id === j.pid)!;
  const ap = db.appliances.find(x => x.id === j.aid);
  const today = todayIso();

  const schedulable = ['New request', 'Awaiting review', 'Ready to schedule', 'Reschedule requested'].includes(j.status);
  const isScheduled = j.status === 'Scheduled' && !sc;
  const isActive = ['In progress', 'Awaiting parts'].includes(j.status) && !cf;
  const access = j.access || p.access;

  const status = (s: JobStatus, text: string) => run(setJobStatus(j.id, s, text), s);
  const openSched = () => setSc({ date: '', slot: '', eng: ENGINEERS[0], err: '' });

  const details = ([
    ['Description', j.desc], ['Fault code', j.fault], ['Heating working', j.heating], ['Hot water working', j.hot], ['Preferred times', j.pref],
    ['Reschedule request', j.status === 'Reschedule requested' ? j.reschedPref : ''], ['Photos', j.files?.length ? j.files.join(', ') : ''],
  ] as [string, string | undefined][]).filter(x => x[1]).map(([k, v]) => ({ k, v: v! }));

  const confirmSched = async () => {
    if (!sc) return;
    if (!sc.date || !sc.slot) return setSc({ ...sc, err: 'Choose a date and a time window.' });
    const tk = slotTaken(db, j.id, sc.date, sc.slot, sc.eng);
    if (tk) return setSc({ ...sc, err: sc.eng + ' is already booked ' + fd(sc.date) + ', ' + sc.slot + ' (' + tk.ref + '). Choose another slot or engineer.' });
    try {
      await scheduleJob(j.id, sc.date, sc.slot, sc.eng);
      setSc(null);
      toast('Appointment confirmed');
    } catch (e) {
      setSc({ ...sc, err: (e as Error).message });
    }
  };

  const submitComplete = async () => {
    if (!cf) return;
    const err = !cf.summary.trim() ? 'Add a summary of the work carried out.'
      : cf.hours && !/^\d+(\.\d+)?$/.test(cf.hours) ? 'Labour should be a number of hours.'
      : ap && (!cf.nextDue || cf.nextDue <= today) ? 'Set the next service due date.'
      : !cf.sign ? 'Confirm engineer sign-off before submitting.' : '';
    if (err) return setCf({ ...cf, err });
    try {
      await completeJob(j.id, { summary: cf.summary.trim(), findings: cf.findings.trim(), recs: cf.recs.trim(), hours: cf.hours }, ap ? cf.nextDue : null);
      setCf(null);
      toast('Job completed. Record shared with customer.');
    } catch (e) {
      setCf({ ...cf, err: (e as Error).message });
    }
  };

  const saveNote = () => {
    const t = note.trim();
    if (!t) return;
    run(addNote(j.id, t)).then(ok => { if (ok) setNote(''); });
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <T s={13} w="600" c={C.meta}>{j.ref} · Received {fl(j.created)}</T>
          <Pill {...jobPill(j.status, 'a')} />
        </View>
        <T s={24} w="700">{j.svc}</T>
      </View>

      {j.appt && j.status !== 'Cancelled' ? (
        <View style={{ backgroundColor: C.blue, borderRadius: 4, padding: 14, gap: 3 }}>
          <T s={17} w="700" c={C.white}>{fd(j.appt.date)} · {j.appt.slot}</T>
          <T s={13} c={C.white}>Engineer: {j.eng || 'Unassigned'}</T>
        </View>
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Tap onPress={() => router.push(`/owner/customer/${cu.id}`)} style={{ minHeight: 32, justifyContent: 'center', flexShrink: 1 }}>
            <T s={16} w="700" c={C.blue}>{cu.name} ›</T>
          </Tap>
          <Tap onPress={() => Linking.openURL(tel(cu.phone))}><T s={14} w="700" c={C.red}>{cu.phone}</T></Tap>
        </View>
        <T s={14}>{p.addr}, {p.town} {p.pc}</T>
        {access ? <View style={{ backgroundColor: C.surfaceAlt, padding: 10, borderRadius: 4 }}><T s={13}>Access: {access}</T></View> : null}
        {ap ? (
          <View style={{ gap: 2, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
            <T s={14} w="600">{ap.type} · {ap.make} {ap.model}</T>
            <T s={12} c={C.meta}>Serial {ap.serial || 'not recorded'} · last service {fl(ap.last)}</T>
          </View>
        ) : null}
      </Card>

      <KVRows rows={details} />

      <View style={{ gap: 10 }}>
        {schedulable && !sc ? <View style={{ flexDirection: 'row' }}><Btn title={j.status === 'Reschedule requested' ? 'Confirm New Appointment' : 'Schedule Appointment'} onPress={openSched} /></View> : null}
        {['Awaiting quotation', 'Follow-up required'].includes(j.status) ? (
          <View style={{ flexDirection: 'row' }}><Btn title="Create Quotation" onPress={() => router.push({ pathname: '/owner/builder', params: { jid: j.id } })} /></View>
        ) : null}
        {j.status === 'Quotation issued' && j.quote ? <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="View Quotation" onPress={() => router.push(`/owner/quote/${j.quote}`)} /></View> : null}
        {j.status === 'Cancellation requested' ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="secondary" title="Offer New Date" onPress={openSched} />
            <Btn title="Confirm Cancel" onPress={() => status('Cancelled', 'Cancellation confirmed')} />
          </View>
        ) : null}
        {isScheduled ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn title="Start Job" onPress={() => status('In progress', 'Engineer on site. Work in progress.')} />
              <Btn variant="secondary" title="Reschedule" onPress={openSched} />
            </View>
            <LinkBtn title="Cancel Booking" color={C.red} style={{ alignSelf: 'center' }} onPress={() => confirm({
              title: 'Cancel ' + j.ref + '?', body: 'The customer will see this booking as cancelled. The record and its history are kept.', yes: 'Cancel Booking',
              onYes: () => status('Cancelled', 'Booking cancelled by Stark'),
            })} />
          </>
        ) : null}
        {isActive ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {j.status === 'In progress' ? <Btn variant="secondary" title="Awaiting Parts" onPress={() => status('Awaiting parts', 'Awaiting parts')} /> : null}
            {j.status === 'Awaiting parts' ? <Btn variant="secondary" title="Parts Arrived" onPress={() => status('In progress', 'Parts arrived. Work in progress.')} /> : null}
            <Btn title="Complete Job" onPress={() => setCf({ summary: '', findings: '', recs: '', hours: '', nextDue: addDays(today, 365), sign: false, err: '' })} />
          </View>
        ) : null}
      </View>

      {sc ? (
        <Card style={{ borderWidth: 2, borderColor: C.blue }}>
          <T s={16} w="700">Choose appointment</T>
          <Field label="Engineer"><Chips options={ENGINEERS} value={sc.eng} onChange={v => setSc({ ...sc, eng: v, err: '' })} /></Field>
          <Field label="Date"><Chips options={weekdays(today, 6, true)} value={sc.date} onChange={v => setSc({ ...sc, date: v, err: '' })} labels={fd} /></Field>
          <Field label="Time window">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SLOTS.map(sl => {
                const sel = sl === sc.slot;
                const tk = sc.date ? slotTaken(db, j.id, sc.date, sl, sc.eng) : undefined;
                return (
                  <Tap key={sl} onPress={() => setSc({ ...sc, slot: sl, err: '' })}
                    style={{ width: '48%', flexGrow: 1, backgroundColor: sel ? C.blue : C.surfaceAlt, borderRadius: 4, padding: 10, gap: 2, minHeight: 52 }}>
                    <T s={14} w="700" c={sel ? C.white : tk ? C.muted : C.ink}>{sl}</T>
                    <T s={11} c={sel ? C.white : tk ? C.muted : C.ink}>{tk ? 'Booked · ' + tk.ref : sc.date ? 'Free' : ''}</T>
                  </Tap>
                );
              })}
            </View>
          </Field>
          <ErrorBox>{sc.err}</ErrorBox>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="secondary" title="Cancel" onPress={() => setSc(null)} />
            <Btn variant="blue" title="Confirm" onPress={confirmSched} />
          </View>
        </Card>
      ) : null}

      {cf ? (
        <Card style={{ borderWidth: 2, borderColor: C.red }}>
          <T s={16} w="700">Completion record</T>
          <Field label="Work carried out"><Input rows={3} value={cf.summary} onChangeText={v => setCf({ ...cf, summary: v, err: '' })} /></Field>
          <Field label="Findings"><Input rows={2} value={cf.findings} onChangeText={v => setCf({ ...cf, findings: v, err: '' })} /></Field>
          <Field label="Recommendations (shared with customer)"><Input rows={2} value={cf.recs} onChangeText={v => setCf({ ...cf, recs: v, err: '' })} /></Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Labour (hours)"><Input value={cf.hours} onChangeText={v => setCf({ ...cf, hours: v, err: '' })} keyboardType="decimal-pad" /></Field></View>
            {ap ? <View style={{ flex: 1 }}><Field label="Next service due"><DateField value={cf.nextDue} minimumDate={addDays(today, 1)} onChange={v => setCf({ ...cf, nextDue: v, err: '' })} /></Field></View> : null}
          </View>
          <Checkbox checked={cf.sign} onPress={() => setCf({ ...cf, sign: !cf.sign, err: '' })} label="I confirm this work is complete and recorded accurately" />
          <ErrorBox>{cf.err}</ErrorBox>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="secondary" title="Cancel" onPress={() => setCf(null)} />
            <Btn title="Submit" onPress={submitComplete} />
          </View>
        </Card>
      ) : null}

      {j.status === 'Completed' && j.record ? (
        <Section title="Completion record" gap={8}>
          <KVRows rows={([
            ['Completed', fl(j.record.date) + ' · ' + j.record.eng], ['Work carried out', j.record.summary], ['Findings', j.record.findings],
            ['Recommendations', j.record.recs || 'None'], ['Labour', j.record.hours ? j.record.hours + ' hours' : ''],
          ] as [string, string][]).filter(x => x[1]).map(([k, v]) => ({ k, v }))} />
        </Section>
      ) : null}

      <Section title="Internal notes">
        {(j.notes || []).slice().reverse().map((n, i) => (
          <View key={i} style={{ backgroundColor: C.note, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4, gap: 3 }}>
            <T s={14}>{n.t}</T>
            <T s={11} c={C.meta}>{fStamp(n.at)}</T>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input value={note} onChangeText={setNote} placeholder="Add a note (not shown to customer)" style={{ flex: 1, width: undefined }} onSubmitEditing={saveNote} returnKeyType="done" />
          <Tap onPress={saveNote} style={{ backgroundColor: C.ink, paddingHorizontal: 16, borderRadius: 4, minHeight: 46, justifyContent: 'center' }}>
            <T s={15} w="700" c={C.white}>Add</T>
          </Tap>
        </View>
      </Section>

      <Section title="History" gap={8}>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
          {j.hist.slice().reverse().map((h, i) => (
            <View key={i} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line, gap: 2 }}>
              <T s={13}>{h.t}{h.int ? ' (internal)' : ''}</T>
              <T s={11} c={C.meta}>{fStamp(h.at)}</T>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
