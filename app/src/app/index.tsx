import { Redirect } from 'expo-router';
import { useSession } from '../data/store';

export default function Index() {
  const session = useSession();
  if (!session) return <Redirect href="/sign-in" />;
  return <Redirect href={session.role === 'owner' ? '/owner' : '/customer'} />;
}
