import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { RoleShell } from '../../components/RoleShell';
import { T } from '../../components/ui';
import { useSession } from '../../data/store';
import { C } from '../../theme';

const TABS = [
  { key: 'dash', label: 'Dashboard' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'customers', label: 'Customers' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'more', label: 'More' },
];
const TITLES = { job: 'Job', customer: 'Customer', quotes: 'Quotations', quote: 'Quotation', invoices: 'Invoices', invoice: 'Invoice', reminders: 'Service Reminders', settings: 'Settings', team: 'Team', builder: 'New Quotation' };

export default function OwnerLayout() {
  const session = useSession();
  if (session?.role !== 'owner') return <Redirect href="/sign-in" />;
  return (
    <RoleShell
      base="/owner"
      tabs={TABS}
      titles={TITLES}
      right={
        <View style={{ backgroundColor: C.ink, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 3 }}>
          <T s={11} w="700" c={C.white} lh={13} style={{ letterSpacing: 0.5 }}>OWNER</T>
        </View>
      }
    />
  );
}
