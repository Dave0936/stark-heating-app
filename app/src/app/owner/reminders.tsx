import { View } from 'react-native';
import { Btn, Card, Empty, Screen, Section, T, Tap } from '../../components/ui';
import { run } from '../../components/overlay';
import { useDB } from '../../data/store';
import { sendReminder, setReminderDays } from '../../data/actions';
import type { Appliance } from '../../data/types';
import { diffDays, fl, fStamp, todayIso } from '../../lib/format';
import { C } from '../../theme';

export default function Reminders() {
  const db = useDB();
  const T0 = todayIso(), rd = db.settings.reminderDays;
  const list = db.appliances.filter(x => x.next).sort((x, y) => x.next.localeCompare(y.next));
  const over = list.filter(x => diffDays(T0, x.next) < 0);
  const soon = list.filter(x => { const d = diffDays(T0, x.next); return d >= 0 && d <= rd; });

  const row = (x: Appliance) => {
    const p = db.properties.find(y => y.id === x.pid)!;
    const cu = db.customers.find(c => c.id === p.cid)!;
    const dd = diffDays(T0, x.next);
    const sent = db.reminders.find(r => r.aid === x.id && r.due === x.next);
    return (
      <Card key={x.id} gap={5}>
        <T s={15} w="700">{cu.name}</T>
        <T s={13} c={C.meta}>{p.addr}, {p.town}</T>
        <T s={13}>{x.type} · {x.make} {x.model}</T>
        <T s={13} w="700" c={dd < 0 ? C.red : C.ink}>{(dd < 0 ? 'Overdue · was due ' : dd === 0 ? 'Due today · ' : 'Due in ' + dd + ' days · ') + fl(x.next)}</T>
        {sent ? (
          <View style={{ backgroundColor: C.surfaceAlt, padding: 8, borderRadius: 4 }}><T s={12}>Logged {fStamp(sent.at)} · {sent.log}</T></View>
        ) : (
          <View style={{ flexDirection: 'row', marginTop: 4 }}><Btn variant="blue" title="Send Reminder" onPress={() => run(sendReminder(x.id), 'Reminder logged')} /></View>
        )}
      </Card>
    );
  };

  const step = (label: string, delta: number) => (
    <Tap onPress={() => run(setReminderDays(db, delta))} label={label} pressedStyle={{ backgroundColor: C.pressed }} style={{ width: 44, height: 44, backgroundColor: C.white, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
      <T s={20} w="700">{delta < 0 ? '−' : '+'}</T>
    </Tap>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: C.surfaceAlt, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4 }}>
        <T s={14} w="600">Remind within {rd} days</T>
        <View style={{ flexDirection: 'row', gap: 6 }}>{step('Fewer days', -7)}{step('More days', 7)}</View>
      </View>
      {over.length ? <Section title="Overdue" titleColor={C.red}>{over.map(row)}</Section> : null}
      {soon.length ? <Section title="Due soon">{soon.map(row)}</Section> : null}
      {!over.length && !soon.length ? <Empty s={14}>No services due in this window.</Empty> : null}
    </Screen>
  );
}
