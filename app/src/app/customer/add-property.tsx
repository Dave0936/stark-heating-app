import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Chips, ErrorBox, Field, Input, Screen } from '../../components/ui';
import { toast } from '../../components/overlay';
import { useCustomer } from '../../data/useCustomer';
import { addProperty } from '../../data/actions';

const TYPES = ['House', 'Flat', 'Bungalow', 'Other'] as const;
const RELS = ['Homeowner', 'Landlord', 'Tenant'] as const;
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export default function AddProperty() {
  const { cid } = useCustomer();
  const [f, setF] = useState({ nick: '', addr: '', town: '', pc: '', ptype: 'House', rel: 'Homeowner', access: '', err: '' });
  const set = (patch: Partial<typeof f>) => setF(x => ({ ...x, ...patch, err: '' }));

  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (busy) return;
    if (!f.addr.trim() || !f.town.trim()) return setF(x => ({ ...x, err: 'Enter the address and town.' }));
    if (!POSTCODE.test(f.pc.trim())) return setF(x => ({ ...x, err: 'Enter a valid UK postcode, e.g. EH55 8AH.' }));
    setBusy(true);
    try {
      await addProperty({ cid, nick: f.nick.trim() || f.addr.trim(), addr: f.addr.trim(), town: f.town.trim(), pc: f.pc.trim().toUpperCase(), ptype: f.ptype, rel: f.rel, access: f.access.trim() });
      toast('Property added');
      router.back();
    } catch (e) {
      setF(x => ({ ...x, err: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Field label="Name (optional)"><Input value={f.nick} onChangeText={v => set({ nick: v })} placeholder="e.g. Mum's house" /></Field>
      <Field label="Address"><Input value={f.addr} onChangeText={v => set({ addr: v })} autoComplete="street-address" /></Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Town"><Input value={f.town} onChangeText={v => set({ town: v })} /></Field></View>
        <View style={{ flex: 1 }}><Field label="Postcode"><Input value={f.pc} onChangeText={v => set({ pc: v })} autoCapitalize="characters" autoComplete="postal-code" /></Field></View>
      </View>
      <Field label="Property type"><Chips options={TYPES} value={f.ptype as never} onChange={v => set({ ptype: v })} /></Field>
      <Field label="You are the"><Chips options={RELS} value={f.rel as never} onChange={v => set({ rel: v })} /></Field>
      <Field label="Access notes"><Input rows={2} value={f.access} onChangeText={v => set({ access: v })} /></Field>
      <ErrorBox>{f.err}</ErrorBox>
      <View style={{ flexDirection: 'row' }}><Btn title={busy ? 'Saving…' : 'Save Property'} onPress={save} /></View>
    </Screen>
  );
}
