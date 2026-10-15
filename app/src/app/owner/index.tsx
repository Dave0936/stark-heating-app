import { View } from 'react-native';
import { router } from 'expo-router';
import { Empty, FeedList, H2, JobCard, Screen, Section, T, Tap } from '../../components/ui';
import { useNav } from '../../components/RoleShell';
import { useDB } from '../../data/store';
import { ownerStats } from '../../data/owner';
import { jobCard } from '../../data/selectors';
import { fLong, fStamp, money } from '../../lib/format';
import { C } from '../../theme';

export default function Dashboard() {
  const db = useDB();
  const nav = useNav();
  const { T: today, rd, due, unpaid, balance, todays, count } = ownerStats(db);

  const jobsTab = (f: string) => () => nav.goTab('jobs?filter=' + encodeURIComponent(f));
  const tiles: [number, string, () => void, boolean][] = [
    [count('Needs Action'), 'Needs Action', jobsTab('Needs Action'), true],
    [todays.length, 'Booked Today', () => nav.goTab('calendar'), false],
    [count('In Progress'), 'In Progress', jobsTab('In Progress'), false],
    [count('Awaiting Parts'), 'Awaiting Parts', jobsTab('Awaiting Parts'), false],
    [db.quotes.filter(q => q.status === 'Issued').length, 'Quotes Awaiting Decision', () => nav.goTab('more', ['quotes']), false],
    [due.length, 'Services Due ≤ ' + rd + ' Days', () => nav.goTab('more', ['reminders']), true],
    [unpaid.length, 'Unpaid · ' + money(balance), () => nav.goTab('more', ['invoices']), true],
  ];

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <T s={13} w="600" c={C.meta}>{fLong(today)}</T>
        <H2>Dashboard</H2>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tiles.map(([n, label, onPress, hot]) => (
          <Tap key={label} onPress={onPress} pressedStyle={{ backgroundColor: C.pressed }}
            style={{ width: '48.5%', flexGrow: 1, backgroundColor: C.surfaceAlt, borderRadius: 4, padding: 14, gap: 4, minHeight: 84 }}>
            <T s={28} w="700" c={hot && n > 0 ? C.red : C.ink}>{String(n)}</T>
            <T s={12} w="600" lh={16}>{label}</T>
          </Tap>
        ))}
      </View>
      <Section title="Today's appointments">
        {todays.map(j => <JobCard key={j.id} showWho j={jobCard(db, j, 'a')} onPress={() => router.push(`/owner/job/${j.id}`)} />)}
        {todays.length === 0 ? <Empty s={14}>Nothing booked today.</Empty> : null}
      </Section>
      <Section title="Recent activity">
        <FeedList compact items={db.feed.slice(0, 6).map(f => ({ t: f.t, at: fStamp(f.at), onPress: f.jid ? () => router.push(`/owner/job/${f.jid}`) : undefined }))} />
      </Section>
    </Screen>
  );
}
