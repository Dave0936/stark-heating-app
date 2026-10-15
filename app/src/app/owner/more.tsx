import { View } from 'react-native';
import { router } from 'expo-router';
import { H2, Screen, T, Tap } from '../../components/ui';
import { useDB } from '../../data/store';
import { ownerStats } from '../../data/owner';
import { money } from '../../lib/format';
import { C } from '../../theme';

export default function More() {
  const db = useDB();
  const { due, unpaid, balance, rd } = ownerStats(db);
  const items: [string, string, string][] = [
    ['Quotations', db.quotes.length + ' total · ' + db.quotes.filter(x => x.status === 'Issued').length + ' awaiting decision', 'quotes'],
    ['Invoices & Payments', unpaid.length + ' unpaid · ' + money(balance) + ' outstanding', 'invoices'],
    ['Service Reminders', due.length + ' due within ' + rd + ' days', 'reminders'],
    ['Team', 'Who can use the owner app', 'team'],
    ['Settings & Integrations', 'Services, reminder timing, providers', 'settings'],
  ];
  return (
    <Screen>
      <H2>More</H2>
      <View style={{ gap: 8 }}>
        {items.map(([label, sub, path]) => (
          <Tap key={path} onPress={() => router.push(`/owner/${path}` as never)} pressedStyle={{ backgroundColor: C.pressed }}
            style={{ backgroundColor: C.surfaceAlt, borderRadius: 4, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, gap: 3 }}><T s={16} w="700">{label}</T><T s={13} c={C.meta}>{sub}</T></View>
            <T s={20}>›</T>
          </Tap>
        ))}
      </View>
    </Screen>
  );
}
