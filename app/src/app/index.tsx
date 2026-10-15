import { Redirect } from 'expo-router';
import { useRecovering, useSession } from '../data/store';

export default function Index() {
  const session = useSession();
  const recovering = useRecovering();
  if (recovering) return <Redirect href="/reset-password" />;
  if (!session) return <Redirect href="/sign-in" />;
  return <Redirect href={session.role === 'owner' ? '/owner' : '/customer'} />;
}
