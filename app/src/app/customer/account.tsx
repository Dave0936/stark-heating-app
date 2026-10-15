import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Chips, Field, H2, Input, Screen, Section, Toggle } from '../../components/ui';
import { run, toast } from '../../components/overlay';
import { useCustomer } from '../../data/useCustomer';
import { saveProfile } from '../../data/actions';
import { signOut } from '../../data/store';
import type { ContactPref, Notify } from '../../data/types';
import { C } from '../../theme';

const PREFS: ContactPref[] = ['Email', 'Phone', 'SMS'];
const TOGGLES: [keyof Notify, string, string][] = [
  ['email', 'Email', 'Booking updates, quotes and reminders'],
  ['sms', 'Text message', 'SMS provider not yet set up'],
  ['push', 'Push notifications', 'Push service not yet set up'],
];

export default function Account() {
  const { cid, me } = useCustomer();
  const [pf, setPf] = useState({ first: me.first, last: me.last, phone: me.phone, pref: me.pref, notify: me.notify });

  const save = () => {
    if (!pf.first.trim() || !pf.last.trim()) return toast('Enter your first and last name');
    if (!/^[0-9 +]{10,14}$/.test(pf.phone.trim())) return toast('Enter a valid phone number');
    run(saveProfile(cid, pf), 'Profile saved');
  };
  const leave = async () => { await signOut(); router.replace('/sign-in'); };

  return (
    <Screen>
      <H2>Account</H2>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="First name"><Input value={pf.first} onChangeText={v => setPf({ ...pf, first: v })} autoComplete="given-name" /></Field></View>
        <View style={{ flex: 1 }}><Field label="Last name"><Input value={pf.last} onChangeText={v => setPf({ ...pf, last: v })} autoComplete="family-name" /></Field></View>
      </View>
      <Field label="Email"><Input value={me.email} editable={false} /></Field>
      <Field label="Phone"><Input value={pf.phone} onChangeText={v => setPf({ ...pf, phone: v })} keyboardType="phone-pad" autoComplete="tel" /></Field>
      <Field label="Preferred contact"><Chips options={PREFS} value={pf.pref} onChange={v => setPf({ ...pf, pref: v })} /></Field>
      <Section title="Notifications" gap={6}>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
          {TOGGLES.map(([k, label, sub]) => (
            <Toggle key={k} label={label} sub={sub} on={!!pf.notify[k]} onPress={() => setPf({ ...pf, notify: { ...pf.notify, [k]: !pf.notify[k] } })} />
          ))}
        </View>
      </Section>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row' }}><Btn title="Save Changes" onPress={save} /></View>
        <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Sign Out" onPress={leave} /></View>
      </View>
    </Screen>
  );
}
