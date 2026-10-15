import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, ErrorBox, Field, Input, LinkBtn, Logo, T } from '../components/ui';
import { OverlayHost, toast } from '../components/overlay';
import { setNewPassword, signOut } from '../data/store';
import { C } from '../theme';

/** Reached from a password-reset email: choose a new password, then carry on into the app. */
export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (pw.length < 8) return setErr('Passwords are at least 8 characters.');
    if (pw !== pw2) return setErr('The two passwords don’t match.');
    setBusy(true);
    try {
      const session = await setNewPassword(pw);
      toast('Password updated');
      router.replace(session?.role === 'owner' ? '/owner' : session ? '/customer' : '/sign-in');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 48 + insets.top, paddingHorizontal: 24, paddingBottom: 48 + insets.bottom, gap: 18 }}>
        <Logo height={56} style={{ alignSelf: 'flex-start' }} />
        <T s={27} w="700" style={{ marginTop: 12 }}>Choose a new password</T>
        <T s={15} c={C.meta}>Use at least 8 characters. You’ll stay signed in on this device.</T>
        <Field label="New password">
          <Input value={pw} onChangeText={v => { setPw(v); setErr(''); }} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        </Field>
        <Field label="Confirm new password">
          <Input value={pw2} onChangeText={v => { setPw2(v); setErr(''); }} secureTextEntry autoComplete="new-password" textContentType="newPassword" onSubmitEditing={save} />
        </Field>
        <ErrorBox>{err}</ErrorBox>
        <View style={{ flexDirection: 'row' }}><Btn title={busy ? 'Saving…' : 'Save Password'} onPress={busy ? undefined : save} /></View>
        <LinkBtn title="Cancel and sign in" onPress={cancel} style={{ alignSelf: 'flex-start' }} />
      </ScrollView>
      <OverlayHost tabBarHeight={insets.bottom} />
    </KeyboardAvoidingView>
  );
}
