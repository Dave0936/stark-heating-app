import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Btn, Screen, T } from '../../../components/ui';
import { useNav } from '../../../components/RoleShell';
import { useDB } from '../../../data/store';
import { C } from '../../../theme';

export default function BookDone() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const nav = useNav();
  const j = db.jobs.find(x => x.id === id);

  return (
    <Screen bare contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 56, gap: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
        <T s={28} w="700" c={C.white} lh={34}>✓</T>
      </View>
      <T s={27} w="700">Request sent</T>
      <T s={15} lh={24} c={C.ink2}>
        Your reference is <T s={15} w="700" c={C.ink2}>{j?.ref ?? ''}</T>. We’ll review it and confirm an appointment with you. You’ll see updates here.
      </T>
      <View style={{ gap: 10, marginTop: 8 }}>
        <View style={{ flexDirection: 'row' }}><Btn title="View Request" onPress={() => nav.goTab('bookings', [`job/${id}`])} /></View>
        <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Back To Home" onPress={() => nav.goTab('home')} /></View>
      </View>
    </Screen>
  );
}
