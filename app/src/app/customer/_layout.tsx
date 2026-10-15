import { ActivityIndicator, Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { RoleShell } from '../../components/RoleShell';
import { T } from '../../components/ui';
import { useDB, useSession } from '../../data/store';
import { C } from '../../theme';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'properties', label: 'Properties' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'documents', label: 'Documents' },
  { key: 'account', label: 'Account' },
];
const TITLES = { book: 'Request A Service', 'book-done': 'Request Sent', job: 'Booking', quote: 'Quotation', doc: 'Document', emergency: 'Emergency Advice', 'add-property': 'Add Property' };

export default function CustomerLayout() {
  const session = useSession();
  const db = useDB();
  if (session?.role !== 'customer') return <Redirect href="/sign-in" />;
  // Wait for the first load so screens can rely on the customer record.
  if (!db.customers.some(c => c.id === session.cid)) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white }}><ActivityIndicator color={C.red} /></View>;
  }
  return (
    <RoleShell
      base="/customer"
      tabs={TABS}
      titles={TITLES}
      hideTabsOn={['book', 'book-done']}
      right={
        <Pressable accessibilityRole="button" onPress={() => router.push('/customer/emergency')}
          style={({ pressed }) => ({ backgroundColor: pressed ? C.redTint : C.white, borderWidth: 2, borderColor: C.red, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, minHeight: 40, justifyContent: 'center' })}>
          <T s={12} w="700" c={C.red}>Smell Gas?</T>
        </Pressable>
      }
    />
  );
}
