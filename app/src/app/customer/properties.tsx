import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Card, Eyebrow, H2, Screen, T, Tag } from '../../components/ui';
import { useCustomer } from '../../data/useCustomer';
import { fl } from '../../lib/format';
import { C } from '../../theme';

export default function Properties() {
  const { db, props } = useCustomer();
  return (
    <Screen>
      <H2>Properties</H2>
      {props.map(p => {
        const apps = db.appliances.filter(a => a.pid === p.id);
        return (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <T s={17} w="700">{p.nick}</T>
                <T s={13} c={C.meta}>{p.addr}, {p.town} {p.pc}</T>
              </View>
              <Tag text={p.rel} />
            </View>
            {p.access ? <View style={{ backgroundColor: C.surfaceAlt, padding: 10, borderRadius: 4 }}><T s={13}>Access: {p.access}</T></View> : null}
            <Eyebrow style={{ marginTop: 4 }}>Appliances</Eyebrow>
            {apps.map(a => (
              <View key={a.id} style={{ gap: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <T s={15} w="600" style={{ flex: 1 }}>{a.make} {a.model}</T>
                  <Tag small text={a.verified ? 'Verified by Stark' : 'Added by you'} bg={a.verified ? C.blue : C.pressed} fg={a.verified ? C.white : C.ink} />
                </View>
                <T s={12} c={C.meta}>{a.type} · {a.next ? 'Next service ' + fl(a.next) : 'No service date recorded'}</T>
              </View>
            ))}
            {apps.length === 0 ? <T s={13} c={C.meta}>No appliances recorded yet.</T> : null}
          </Card>
        );
      })}
      <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Add A Property" onPress={() => router.push('/customer/add-property')} /></View>
    </Screen>
  );
}
