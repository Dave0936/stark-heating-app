import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, InfoBox, LineItems, Screen, T } from '../../../components/ui';
import { useDB } from '../../../data/store';
import { totals } from '../../../data/actions';
import { lineRows } from '../../../data/selectors';
import { fl, fStamp, money } from '../../../lib/format';
import { C } from '../../../theme';

export default function OwnerQuote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const q = db.quotes.find(x => x.id === id);
  if (!q) return <Screen><T>This quotation no longer exists.</T></Screen>;
  const t = totals(q.lines, q.vat);
  const cu = db.customers.find(c => c.id === q.cid);
  const j = db.jobs.find(x => x.id === q.jid);
  const canRevise = q.status === 'Issued' || q.status === 'Declined';

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T s={13} w="600" c={C.meta}>{q.ref} · Version {q.ver} · {q.status}</T>
        <T s={22} w="700">{j?.svc ?? ''}</T>
        <T s={14}>{cu?.name}</T>
        <T s={12} c={C.meta}>Issued {fl(q.issued)} · expires {fl(q.expires)}</T>
      </View>
      <LineItems lines={lineRows(q.lines)} sub={money(t.sub)} vatLabel={'VAT (' + q.vat + '%)'} vat={money(t.v)} total={money(t.total)} />
      {q.decision ? <InfoBox c={C.ink} w="600">{q.decision.d} by {q.decision.by} · {fStamp(q.decision.at)} · v{q.decision.ver}</InfoBox> : null}
      {q.status === 'Issued' ? <InfoBox bg={C.blueTint} c={C.ink}>Waiting for the customer’s decision.</InfoBox> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {j ? <Btn variant="secondary" title="Open Job" onPress={() => router.push(`/owner/job/${j.id}`)} /> : null}
        {canRevise ? <Btn title="Revise Quote" onPress={() => router.push({ pathname: '/owner/builder', params: { jid: q.jid, base: q.id } })} /> : null}
      </View>
    </Screen>
  );
}
