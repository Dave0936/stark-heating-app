import { router } from 'expo-router';
import { CardHead, Empty, ListCard, Screen, T } from '../../components/ui';
import { useDB } from '../../data/store';
import { totals } from '../../data/actions';
import { ownerQuotePill } from '../../data/selectors';
import { money } from '../../lib/format';
import { C } from '../../theme';

export default function Quotes() {
  const db = useDB();
  const quotes = db.quotes.slice().reverse();
  return (
    <Screen gap={10}>
      {quotes.map(q => (
        <ListCard key={q.id} gap={4} onPress={() => router.push(`/owner/quote/${q.id}`)}>
          <CardHead left={q.ref + ' v' + q.ver} pill={ownerQuotePill(q)} leftSize={15} leftColor={C.ink} />
          <T s={13} c={C.meta}>{db.customers.find(c => c.id === q.cid)?.name}</T>
          <T s={13} w="600">{money(totals(q.lines, q.vat).total)}</T>
        </ListCard>
      ))}
      {quotes.length === 0 ? <Empty s={14}>No quotations yet.</Empty> : null}
    </Screen>
  );
}
