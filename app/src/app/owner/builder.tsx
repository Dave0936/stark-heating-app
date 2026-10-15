import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Btn, Card, Chips, ErrorBox, Field, Input, LinkBtn, Screen, T } from '../../components/ui';
import { DateField } from '../../components/DateField';
import { toast } from '../../components/overlay';
import { useDB } from '../../data/store';
import { defaultExpiry, issueQuote, totals } from '../../data/actions';
import { addDays, money, todayIso } from '../../lib/format';
import { C } from '../../theme';

type DraftLine = { d: string; q: string; u: string };
const PRICE = /^\d+(\.\d{1,2})?$/;
const VATS = ['20%', '5%', '0%'] as const;

export default function QuoteBuilder() {
  const { jid, base: baseId } = useLocalSearchParams<{ jid: string; base?: string }>();
  const db = useDB();
  const j = db.jobs.find(x => x.id === jid);
  const base = baseId ? db.quotes.find(q => q.id === baseId) ?? null : null;

  const [b, setB] = useState(() => ({
    lines: base ? base.lines.map(l => ({ d: l.d, q: String(l.q), u: (l.u / 100).toFixed(2) })) : [{ d: '', q: '1', u: '' }] as DraftLine[],
    vat: base ? base.vat : 20,
    expiry: defaultExpiry(),
    excl: base ? base.excl.join('\n') : '',
    err: '',
  }));
  if (!j) return <Screen><T>This job no longer exists.</T></Screen>;
  const cu = db.customers.find(c => c.id === j.cid);

  const set = (patch: Partial<typeof b>) => setB(x => ({ ...x, ...patch, err: '' }));
  const setLine = (i: number, k: keyof DraftLine, v: string) => set({ lines: b.lines.map((l, n) => (n === i ? { ...l, [k]: v } : l)) });

  const parsed = b.lines.map(l => ({ d: l.d.trim(), q: parseInt(l.q, 10), u: PRICE.test(l.u.trim()) ? Math.round(parseFloat(l.u) * 100) : NaN }));
  const valid = (l: (typeof parsed)[number]) => !!l.d && l.q > 0 && !isNaN(l.u);
  const t = totals(parsed.filter(valid), b.vat);

  const issue = async () => {
    if (parsed.some(l => !valid(l))) return setB(x => ({ ...x, err: 'Every item needs a description, a whole-number quantity and a price like 120.00.' }));
    if (!b.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(b.expiry) || b.expiry <= todayIso()) return setB(x => ({ ...x, err: 'Set an expiry date after today.' }));
    try {
      const qid = await issueQuote(j.id, base, { lines: parsed, vat: b.vat, expires: b.expiry, excl: b.excl.split('\n').map(x => x.trim()).filter(Boolean) });
      toast('Quotation issued');
      router.replace(`/owner/quote/${qid}`);
    } catch (e) {
      setB(x => ({ ...x, err: (e as Error).message }));
    }
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <T s={13} w="600" c={C.meta}>{cu?.name} · {j.ref}</T>
        <T s={22} w="700">{base ? 'Revising ' + base.ref + ' → version ' + (base.ver + 1) : 'New quotation'}</T>
        <T s={14}>{j.svc}</T>
      </View>

      {b.lines.map((l, i) => (
        <Card key={i} gap={8}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 }}>
            <T s={12} w="700">Item {i + 1}</T>
            {b.lines.length > 1 ? <LinkBtn title="Remove" color={C.red} onPress={() => set({ lines: b.lines.filter((_, k) => k !== i) })} style={{ minHeight: 36 }} /> : null}
          </View>
          <Input value={l.d} onChangeText={v => setLine(i, 'd', v)} placeholder="Description" />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Input value={l.q} onChangeText={v => setLine(i, 'q', v)} keyboardType="number-pad" accessibilityLabel="Quantity" style={{ width: 70 }} />
            <Input value={l.u} onChangeText={v => setLine(i, 'u', v)} keyboardType="decimal-pad" placeholder="Unit price £" style={{ flex: 1, width: undefined }} />
            <T s={14} w="700" style={{ minWidth: 70, textAlign: 'right' }}>{parsed[i].q > 0 && !isNaN(parsed[i].u) ? money(parsed[i].q * parsed[i].u) : '—'}</T>
          </View>
        </Card>
      ))}
      <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Add Line" onPress={() => set({ lines: b.lines.concat([{ d: '', q: '1', u: '' }]) })} /></View>

      <Field label="VAT rate"><Chips options={VATS} value={(b.vat + '%') as (typeof VATS)[number]} onChange={v => set({ vat: parseInt(v, 10) })} /></Field>
      <Field label="Valid until"><DateField value={b.expiry} minimumDate={addDays(todayIso(), 1)} onChange={v => set({ expiry: v })} /></Field>
      <Field label="Not included (one per line)"><Input rows={3} value={b.excl} onChangeText={v => set({ excl: v })} /></Field>

      <View style={{ gap: 4, borderTopWidth: 2, borderTopColor: C.ink, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T s={14}>Subtotal</T><T s={14}>{money(t.sub)}</T></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T s={14}>VAT ({b.vat}%)</T><T s={14}>{money(t.v)}</T></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T s={18} w="700">Total</T><T s={18} w="700">{money(t.total)}</T></View>
      </View>
      <ErrorBox>{b.err}</ErrorBox>
      <View style={{ flexDirection: 'row' }}><Btn title="Issue To Customer" onPress={issue} /></View>
    </Screen>
  );
}
