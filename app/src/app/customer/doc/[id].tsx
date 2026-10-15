import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Btn, Eyebrow, KVRows, Screen, T } from '../../../components/ui';
import { toast } from '../../../components/overlay';
import { useDB } from '../../../data/store';
import { totals } from '../../../data/actions';
import { fl, money } from '../../../lib/format';
import { C } from '../../../theme';

export default function CustomerDoc() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const d = db.docs.find(x => x.id === id);
  if (!d) return <Screen><T>This document no longer exists.</T></Screen>;
  const p = db.properties.find(x => x.id === d.pid);

  let rows: { k: string; v: string }[];
  if (d.jid) {
    const j = db.jobs.find(x => x.id === d.jid);
    const a = j && db.appliances.find(x => x.id === j.aid);
    const r = j?.record;
    rows = ([
      ['Job', j ? j.ref + ' · ' + j.svc : '—'],
      ['Appliance', a ? a.make + ' ' + a.model + (a.serial ? ' (' + a.serial + ')' : '') : '—'],
      ['Engineer', r?.eng || j?.eng || '—'],
      ['Work carried out', r?.summary || '—'],
      ['Findings', r?.findings || '—'],
      ['Recommendations', r?.recs || 'None'],
      ['Next service due', a?.next ? fl(a.next) : '—'],
    ] as [string, string][]).map(([k, v]) => ({ k, v }));
  } else if (d.iid) {
    const i = db.invoices.find(x => x.id === d.iid)!;
    const t = totals(i.lines, i.vat);
    rows = i.lines.map(l => ({ k: l.d, v: l.q + ' × ' + money(l.u) }))
      .concat([
        { k: 'Subtotal', v: money(t.sub) }, { k: 'VAT (' + i.vat + '%)', v: money(t.v) }, { k: 'Total', v: money(t.total) },
        { k: 'Paid', v: money(i.paid) }, { k: 'Balance', v: money(t.total - i.paid) }, { k: 'Status', v: i.status }, { k: 'Due', v: fl(i.due) },
      ])
      .concat(i.payments.map(pm => ({ k: 'Payment ' + fl(pm.at), v: money(pm.amt) + ' · ' + pm.method + ' · recorded manually' })));
  } else {
    rows = [{ k: 'Type', v: d.type }, { k: 'Date', v: fl(d.date) }, { k: 'Shared by', v: 'Stark Heating & Gas' }];
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Eyebrow c={C.red}>{d.type}</Eyebrow>
        <T s={24} w="700">{d.title}</T>
        <T s={13} c={C.meta}>{fl(d.date)}{p ? ' · ' + p.addr + ', ' + p.town : ''}</T>
      </View>
      <KVRows rows={rows} />
      <View style={{ flexDirection: 'row' }}>
        <Btn variant="secondary" title="Download PDF" onPress={() => toast('PDF download needs file storage set up')} />
      </View>
    </Screen>
  );
}
