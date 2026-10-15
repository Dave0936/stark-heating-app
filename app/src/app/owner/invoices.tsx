import { router } from 'expo-router';
import { CardHead, ListCard, Screen, T } from '../../components/ui';
import { useDB } from '../../data/store';
import { invoiceVM } from '../../data/selectors';
import { C } from '../../theme';

export default function Invoices() {
  const db = useDB();
  return (
    <Screen gap={10}>
      {db.invoices.slice().reverse().map(i => {
        const v = invoiceVM(db, i);
        return (
          <ListCard key={i.id} gap={4} onPress={() => router.push(`/owner/invoice/${i.id}`)}>
            <CardHead left={v.ref} pill={v.pill} leftSize={15} leftColor={C.ink} />
            <T s={13} c={C.meta}>{v.bal}</T>
            <T s={13} w="600">{v.who}</T>
          </ListCard>
        );
      })}
    </Screen>
  );
}
