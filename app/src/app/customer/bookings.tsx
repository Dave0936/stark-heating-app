import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Empty, H2, JobCard, Screen, T, Tap } from '../../components/ui';
import { startBooking, useCustomer } from '../../data/useCustomer';
import { jobCard } from '../../data/selectors';
import { OPEN } from '../../data/catalog';
import { C } from '../../theme';

export default function Bookings() {
  const { db, jobs } = useCustomer();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'upcoming' | 'past'>(params.tab === 'past' ? 'past' : 'upcoming');
  // Follow ?tab= when it changes (e.g. Home → Service History) without an effect.
  const [seenParam, setSeenParam] = useState(params.tab);
  if (params.tab !== seenParam) {
    setSeenParam(params.tab);
    if (params.tab === 'past' || params.tab === 'upcoming') setTab(params.tab);
  }

  const up = jobs.filter(j => OPEN(j.status));
  const past = jobs.filter(j => !OPEN(j.status));
  const list = tab === 'upcoming' ? up : past;

  return (
    <Screen>
      <H2>Bookings</H2>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['upcoming', 'Current (' + up.length + ')'], ['past', 'History (' + past.length + ')']] as const).map(([k, l]) => (
          <Tap key={k} onPress={() => setTab(k)} style={{ flex: 1, backgroundColor: tab === k ? C.ink : C.surfaceAlt, padding: 12, borderRadius: 4, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <T s={14} w="700" c={tab === k ? C.white : C.ink}>{l}</T>
          </Tap>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        {list.map(j => <JobCard key={j.id} j={jobCard(db, j, 'c')} onPress={() => router.push(`/customer/job/${j.id}`)} />)}
      </View>
      {list.length === 0 ? <Empty>Nothing here yet.</Empty> : null}
      <View style={{ flexDirection: 'row' }}><Btn title="Request A Service" onPress={() => startBooking()} /></View>
    </Screen>
  );
}
