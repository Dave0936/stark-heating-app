import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Empty, H2, Input, ListCard, Screen, T } from '../../components/ui';
import { useDB } from '../../data/store';
import { C } from '../../theme';

export default function Customers() {
  const db = useDB();
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const custs = db.customers
    .map(cu => ({ cu, ps: db.properties.filter(p => p.cid === cu.id) }))
    .filter(({ cu, ps }) => !q || (cu.name + ' ' + cu.email + ' ' + ps.map(p => p.addr + ' ' + p.town + ' ' + p.pc).join(' ')).toLowerCase().includes(q));

  return (
    <Screen>
      <H2>Customers</H2>
      <Input value={search} onChangeText={setSearch} placeholder="Search name, email, address or postcode" autoCapitalize="none" clearButtonMode="while-editing" />
      <View style={{ gap: 10 }}>
        {custs.map(({ cu, ps }) => (
          <ListCard key={cu.id} gap={4} onPress={() => router.push(`/owner/customer/${cu.id}`)}>
            <T s={15} w="600">{cu.name}</T>
            <T s={13} c={C.meta}>{ps.length}{ps.length === 1 ? ' property · ' : ' properties · '}{Array.from(new Set(ps.map(p => p.town))).join(', ')}</T>
            <T s={13} w="600">{cu.type}</T>
          </ListCard>
        ))}
      </View>
      {custs.length === 0 ? <Empty s={14}>No customers match.</Empty> : null}
    </Screen>
  );
}
