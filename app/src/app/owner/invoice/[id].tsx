import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Btn, Card, Chips, ErrorBox, Field, Input, LineItems, Pill, Screen, Section, T } from '../../../components/ui';
import { toast } from '../../../components/overlay';
import { useDB } from '../../../data/store';
import { recordPayment } from '../../../data/actions';
import { invoiceVM, lineRows } from '../../../data/selectors';
import { fl, money } from '../../../lib/format';
import { C } from '../../../theme';

const METHODS = ['Bank transfer', 'Card (manual)', 'Cash', 'Cheque'] as const;

export default function OwnerInvoice() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const [pay, setPay] = useState<{ amt: string; method: string; err: string } | null>(null);
  const i = db.invoices.find(x => x.id === id);
  if (!i) return <Screen><T>This invoice no longer exists.</T></Screen>;
  const v = invoiceVM(db, i);
  const balance = v.t.total - i.paid;

  const save = async () => {
    if (!pay) return;
    const p = Math.round(parseFloat(pay.amt) * 100);
    if (!/^\d+(\.\d{1,2})?$/.test(pay.amt.trim()) || !(p > 0)) return setPay({ ...pay, err: 'Enter an amount in pounds, e.g. 50.00' });
    if (p > balance) return setPay({ ...pay, err: "That's more than the balance of " + money(balance) + '.' });
    try {
      await recordPayment(i.id, p, pay.method);
      setPay(null);
      toast('Payment recorded');
    } catch (e) {
      setPay({ ...pay, err: (e as Error).message });
    }
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T s={13} w="600" c={C.meta}>{v.ref}</T>
          <Pill {...v.pill} />
        </View>
        <T s={22} w="700">{v.who}</T>
        <T s={12} c={C.meta}>Issued {fl(i.date)} · due {fl(i.due)}</T>
      </View>
      <LineItems lines={lineRows(i.lines)} sub={money(v.t.sub)} vatLabel={'VAT (' + i.vat + '%)'} vat={money(v.t.v)} total={v.total} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T s={14}>Paid</T><T s={14}>{money(i.paid)}</T></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T s={17} w="700" c={C.red}>Balance</T><T s={17} w="700" c={C.red}>{money(balance)}</T></View>
      {i.payments.length ? (
        <Section title="Payments (recorded manually)" gap={6}>
          {i.payments.map((p, k) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <T s={13}>{fl(p.at)} · {p.method}</T>
              <T s={13} w="700">{money(p.amt)}</T>
            </View>
          ))}
        </Section>
      ) : null}
      {balance > 0 && !pay ? (
        <View style={{ flexDirection: 'row' }}><Btn title="Record Payment" onPress={() => setPay({ amt: (balance / 100).toFixed(2), method: 'Bank transfer', err: '' })} /></View>
      ) : null}
      {pay ? (
        <Card style={{ borderWidth: 2, borderColor: C.red }}>
          <Field label="Amount (£)"><Input value={pay.amt} onChangeText={a => setPay({ ...pay, amt: a, err: '' })} keyboardType="decimal-pad" /></Field>
          <Field label="Method"><Chips options={METHODS} value={pay.method as never} onChange={m => setPay({ ...pay, method: m })} /></Field>
          <ErrorBox>{pay.err}</ErrorBox>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="secondary" title="Cancel" onPress={() => setPay(null)} />
            <Btn title="Save Payment" onPress={save} />
          </View>
          <T s={12} c={C.meta}>Online card payments aren’t set up yet.</T>
        </Card>
      ) : null}
    </Screen>
  );
}
