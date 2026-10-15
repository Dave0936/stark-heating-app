import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chips, Empty, H2, ListCard, Screen, T } from '../../components/ui';
import { useCustomer } from '../../data/useCustomer';
import type { Doc } from '../../data/types';
import { fl } from '../../lib/format';
import { C } from '../../theme';

const FILTERS = {
  All: () => true,
  Reports: (d: Doc) => /report|record|certificate/i.test(d.type),
  Quotes: (d: Doc) => d.type === 'Quotation',
  Invoices: (d: Doc) => d.type === 'Invoice',
};
type Filter = keyof typeof FILTERS;

export default function Documents() {
  const { db, cid } = useCustomer();
  const [filter, setFilter] = useState<Filter>('All');
  const docs = db.docs.filter(d => d.cid === cid).sort((a, b) => b.date.localeCompare(a.date)).filter(FILTERS[filter]);

  return (
    <Screen>
      <H2>Documents</H2>
      <Chips options={Object.keys(FILTERS) as Filter[]} value={filter} onChange={setFilter} />
      <View style={{ gap: 10 }}>
        {docs.map(d => {
          const p = db.properties.find(x => x.id === d.pid);
          const inv = d.iid ? db.invoices.find(x => x.id === d.iid) : undefined;
          return (
            <ListCard key={d.id} gap={4} onPress={() => router.push(d.qid ? `/customer/quote/${d.qid}` : `/customer/doc/${d.id}`)}>
              <T s={15} w="600">{d.title}</T>
              <T s={13} c={C.meta}>{fl(d.date)}{p ? ' · ' + p.nick : ''}{inv ? ' · ' + inv.status : ''}</T>
              <T s={13} w="600">{d.type}</T>
            </ListCard>
          );
        })}
      </View>
      {docs.length === 0 ? <Empty>No documents in this category.</Empty> : null}
    </Screen>
  );
}
