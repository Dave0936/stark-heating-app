import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Card, Chips, ErrorBox, Field, Input, Pill, Screen, Section, T, Timeline } from '../../../components/ui';
import { confirm, run, toast } from '../../../components/overlay';
import { useDB } from '../../../data/store';
import { jobPill } from '../../../data/catalog';
import { requestCancellation, requestReschedule } from '../../../data/actions';
import { fd, fLong, fStamp, todayIso, weekdays } from '../../../lib/format';
import { C } from '../../../theme';

export default function CustomerJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const [rs, setRs] = useState<{ day: string; note: string; err: string } | null>(null);
  const j = db.jobs.find(x => x.id === id);
  if (!j) return <Screen><T>This booking no longer exists.</T></Screen>;
  const p = db.properties.find(x => x.id === j.pid);
  const a = db.appliances.find(x => x.id === j.aid);
  const pl = jobPill(j.status, 'c');

  const hasAppt = !!j.appt && j.status !== 'Cancelled';
  const noAppt = !j.appt && !['Completed', 'Cancelled', 'Quotation issued'].includes(j.status);
  const canResched = j.status === 'Scheduled' && !rs;
  const canCancel = ['New request', 'Scheduled', 'Ready to schedule', 'Reschedule requested'].includes(j.status) && !rs;
  const report = db.docs.find(x => x.jid === j.id);
  const dayOpts = weekdays(todayIso(), 6).map(fd).concat(['Any weekday']);

  const reqCancel = () => confirm({
    title: 'Request cancellation?',
    body: "We'll confirm the cancellation with you. Your appointment stays in place until then.",
    yes: 'Request Cancellation',
    onYes: () => { run(requestCancellation(j.id), 'Cancellation request sent'); },
  });
  const sendResched = async () => {
    if (!rs) return;
    if (!rs.day) return setRs({ ...rs, err: 'Choose a preferred day.' });
    try {
      await requestReschedule(j.id, rs.day + (rs.note.trim() ? ' — ' + rs.note.trim() : ''));
      setRs(null);
      toast('Reschedule request sent');
    } catch (e) {
      setRs({ ...rs, err: (e as Error).message });
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T s={13} w="600" c={C.meta}>{j.ref}</T>
          <Pill {...pl} />
        </View>
        <T s={24} w="700">{j.svc}</T>
        <T s={14} c={C.meta}>{p ? p.nick + ' · ' + p.addr + ', ' + p.town : ''}</T>
      </View>

      {hasAppt && j.appt ? (
        <View style={{ backgroundColor: C.blue, borderRadius: 4, padding: 16, gap: 4 }}>
          <T s={12} w="700" c={C.white} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>Appointment</T>
          <T s={20} w="700" c={C.white}>{fLong(j.appt.date)}</T>
          <T s={15} c={C.white}>{j.appt.slot}</T>
          {j.eng ? <T s={13} c={C.white}>Engineer: {j.eng}</T> : null}
        </View>
      ) : null}
      {noAppt ? (
        <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 4, padding: 14 }}>
          <T s={14}>We’ll confirm a date with you. Your preference: <T s={14} w="700">{j.pref || 'No preference given'}</T></T>
        </View>
      ) : null}
      {j.status === 'Reschedule requested' ? (
        <View style={{ backgroundColor: C.redTint, borderRadius: 4, padding: 14 }}>
          <T s={14}>You asked to move to <T s={14} w="700">{j.reschedPref}</T>. Your current appointment stands until we confirm.</T>
        </View>
      ) : null}
      {j.status === 'Cancellation requested' ? (
        <View style={{ backgroundColor: C.redTint, borderRadius: 4, padding: 14 }}><T s={14}>Cancellation requested. We’ll confirm shortly.</T></View>
      ) : null}

      {rs ? (
        <Card>
          <T s={16} w="700">Request a new date</T>
          <Field label="Preferred day"><Chips options={dayOpts} value={rs.day} onChange={v => setRs({ ...rs, day: v, err: '' })} /></Field>
          <Field label="Anything else? (optional)"><Input value={rs.note} onChangeText={v => setRs({ ...rs, note: v })} placeholder="e.g. afternoons only" /></Field>
          <ErrorBox>{rs.err}</ErrorBox>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="secondary" title="Cancel" onPress={() => setRs(null)} />
            <Btn title="Send Request" onPress={sendResched} />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        {j.quote ? <View style={{ flexDirection: 'row' }}><Btn title="View Quotation" onPress={() => router.push(`/customer/quote/${j.quote}`)} /></View> : null}
        {j.status === 'Completed' && j.record && report ? <View style={{ flexDirection: 'row' }}><Btn variant="blue" title="View Report" onPress={() => router.push(`/customer/doc/${report.id}`)} /></View> : null}
        {canResched || canCancel ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {canResched ? <Btn variant="secondary" title="Reschedule" onPress={() => setRs({ day: '', note: '', err: '' })} /> : null}
            {canCancel ? <Btn variant="danger" title="Cancel" onPress={reqCancel} /> : null}
          </View>
        ) : null}
      </View>

      <Section title="Details" gap={6}>
        {a ? <T s={14}>{a.make} {a.model}</T> : null}
        <T s={14} c={C.ink2}>{j.desc}</T>
      </Section>

      <Section title="Progress">
        <Timeline items={j.hist.filter(h => !h.int).slice().reverse().map(h => ({ t: h.t, at: fStamp(h.at) }))} />
      </Section>
    </Screen>
  );
}
