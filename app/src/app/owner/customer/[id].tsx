import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Card, CardHead, Eyebrow, JobCard, ListCard, Screen, Section, T } from '../../../components/ui';
import { useDB } from '../../../data/store';
import { invoiceVM, jobCard } from '../../../data/selectors';
import { diffDays, fl, todayIso } from '../../../lib/format';
import { C, tel } from '../../../theme';

export default function OwnerCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const cu = db.customers.find(x => x.id === id);
  if (!cu) return <Screen><T>This customer no longer exists.</T></Screen>;
  const T0 = todayIso(), rd = db.settings.reminderDays;
  const ps = db.properties.filter(p => p.cid === cu.id);
  const capps = db.appliances.filter(x => ps.some(p => p.id === x.pid));
  const over = capps.filter(x => x.next && diffDays(T0, x.next) < 0).length;
  const soon = capps.filter(x => x.next && diffDays(T0, x.next) >= 0 && diffDays(T0, x.next) <= rd).length;
  const jobs = db.jobs.filter(j => j.cid === cu.id).sort((x, y) => y.created.localeCompare(x.created));
  const invs = db.invoices.filter(i => i.cid === cu.id);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Eyebrow c={C.red}>{cu.type}</Eyebrow>
        <T s={24} w="700">{cu.name}</T>
        <T s={13} c={C.meta}>Prefers {cu.pref}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn variant="blue" title="Call" onPress={() => Linking.openURL(tel(cu.phone))} />
        <Btn variant="secondary" title="Email" onPress={() => Linking.openURL('mailto:' + cu.email)} />
      </View>
      <T s={14}>{cu.phone} · {cu.email}</T>
      {cu.type === 'Landlord' ? (
        <View style={{ backgroundColor: C.ink, padding: 14, borderRadius: 4 }}>
          <T s={14} w="600" c={C.white}>{ps.length} rental properties · {over} service overdue · {soon} due within {rd} days</T>
        </View>
      ) : null}

      <Section title="Properties">
        {ps.map(p => (
          <Card key={p.id} gap={6}>
            <T s={15} w="700">{p.nick}</T>
            <T s={13} c={C.meta}>{p.addr}, {p.town} {p.pc}</T>
            {db.appliances.filter(x => x.pid === p.id).map(x => {
              const dd = x.next ? diffDays(T0, x.next) : null;
              return (
                <View key={x.id} style={{ gap: 2, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, marginTop: 4 }}>
                  <T s={14}>{x.type} · {x.make} {x.model}</T>
                  <T s={12} w="600" c={dd !== null && dd < 0 ? C.red : C.meta}>{x.next ? (dd! < 0 ? 'Overdue since ' + fl(x.next) : 'Due ' + fl(x.next)) : 'No service date'}</T>
                </View>
              );
            })}
          </Card>
        ))}
      </Section>

      <Section title="Jobs">
        {jobs.map(j => <JobCard key={j.id} showWho j={jobCard(db, j, 'a')} onPress={() => router.push(`/owner/job/${j.id}`)} />)}
      </Section>

      {invs.length ? (
        <Section title="Invoices">
          {invs.map(i => {
            const v = invoiceVM(db, i);
            return (
              <ListCard key={i.id} gap={4} onPress={() => router.push(`/owner/invoice/${i.id}`)}>
                <CardHead left={v.ref} pill={v.pill} leftSize={15} leftColor={C.ink} />
                <T s={13} c={C.meta}>{v.bal}</T>
                <T s={13} w="600">{v.total}</T>
              </ListCard>
            );
          })}
        </Section>
      ) : null}
    </Screen>
  );
}
