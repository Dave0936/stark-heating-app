import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Empty, H2, Screen, T, Tap } from '../../components/ui';
import { useDB } from '../../data/store';
import { ENGINEERS, SLOTS } from '../../data/catalog';
import { jobCard } from '../../data/selectors';
import { addDays, D, dowShort, fLong, isWeekend, todayIso } from '../../lib/format';
import { C } from '../../theme';

export default function Calendar() {
  const db = useDB();
  const today = todayIso();
  const [day, setDay] = useState(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const onDay = (d: string) => db.jobs.filter(j => j.appt && j.appt.date === d && j.status !== 'Cancelled');
  const closed = isWeekend(day);

  return (
    <Screen>
      <H2>Calendar</H2>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {days.map(d => {
          const sel = d === day, n = onDay(d).length;
          return (
            <Tap key={d} onPress={() => setDay(d)} label={fLong(d)}
              style={{ flex: 1, minWidth: 0, backgroundColor: sel ? C.ink : C.surfaceAlt, borderRadius: 4, paddingVertical: 8, alignItems: 'center', gap: 2, minHeight: 64 }}>
              <T s={11} w="600" c={sel ? C.white : C.ink}>{dowShort(d)}</T>
              <T s={18} w="700" c={sel ? C.white : C.ink}>{String(D(d).getDate())}</T>
              <T s={9} c={sel ? C.white : C.ink} numberOfLines={1}>{n ? n + ' job' + (n > 1 ? 's' : '') : isWeekend(d) ? 'Closed' : ''}</T>
            </Tap>
          );
        })}
      </View>
      <T s={16} w="700">{fLong(day)}</T>
      {closed ? <Empty s={14}>Closed at weekends.</Empty> : (
        <View style={{ gap: 12 }}>
          {SLOTS.map(sl => {
            const js = onDay(day).filter(j => j.appt!.slot === sl);
            return (
              <View key={sl} style={{ gap: 8, borderTopWidth: 2, borderTopColor: C.ink, paddingTop: 8 }}>
                <T s={13} w="700">{sl}</T>
                {js.map(j => {
                  const v = jobCard(db, j, 'a');
                  return (
                    <Tap key={j.id} onPress={() => router.push(`/owner/job/${j.id}`)} pressedStyle={{ backgroundColor: '#004293' }} style={{ backgroundColor: C.blue, borderRadius: 4, padding: 12, gap: 2 }}>
                      <T s={14} w="700" c={C.white}>{v.svc} · {v.ref}</T>
                      <T s={12} c={C.white}>{v.who} · {v.place}</T>
                      <T s={12} c={C.white}>{j.eng} · {v.pill.text}</T>
                    </Tap>
                  );
                })}
                {js.length === 0 ? <T s={13} c={C.meta}>Available · {ENGINEERS.length} engineers free</T> : null}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
