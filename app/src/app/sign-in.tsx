import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, ErrorBox, Field, Input, InfoBox, LinkBtn, Logo, T } from '../components/ui';
import { OverlayHost, toast } from '../components/overlay';
import { signIn } from '../data/store';
import { linkError, supabase } from '../lib/supabase';
import { C } from '../theme';

const EMAIL = /^\S+@\S+\.\S+$/;
/** On the web, send email links back to the site the person is using
 *  (the address must be in Supabase's Redirect URLs list); on phones Supabase uses its Site URL. */
const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [f, setF] = useState({ first: '', last: '', phone: '', email: '', pw: '' });
  const [err, setErr] = useState(linkError);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof f>) => { setF(x => ({ ...x, ...patch })); setErr(''); };

  const submit = async () => {
    const email = f.email.trim().toLowerCase();
    if (!EMAIL.test(email)) return setErr('Enter a valid email address.');
    if (f.pw.length < 8) return setErr('Passwords are at least 8 characters.');
    if (mode === 'up') {
      if (!f.first.trim() || !f.last.trim()) return setErr('Enter your first and last name.');
      if (!/^[0-9 +]{10,14}$/.test(f.phone.trim())) return setErr('Enter a valid phone number.');
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        const session = await signIn(email, f.pw);
        router.replace(session?.role === 'owner' ? '/owner' : '/customer');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password: f.pw,
          options: { emailRedirectTo, data: { first_name: f.first.trim(), last_name: f.last.trim(), phone: f.phone.trim() } },
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          const session = await signIn(email, f.pw);
          router.replace(session?.role === 'owner' ? '/owner' : '/customer');
        } else {
          setMode('in');
          setInfo('Check your email and tap the link to confirm your account, then sign in here.');
        }
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const email = f.email.trim().toLowerCase();
    if (!EMAIL.test(email)) return setErr('Enter your email address first.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: emailRedirectTo });
    if (error) return setErr(error.message);
    toast('If that email has an account, we’ve sent a reset link.');
  };

  const up = mode === 'up';
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 48 + insets.top, paddingHorizontal: 24, paddingBottom: 48 + insets.bottom, gap: 18 }}>
        <Logo height={56} style={{ alignSelf: 'flex-start' }} />
        <T s={27} w="700" style={{ marginTop: 12 }}>{up ? 'Create your account' : 'Sign in'}</T>
        <T s={15} c={C.meta}>Manage your heating, bookings and documents.</T>
        {info ? <InfoBox c={C.ink}>{info}</InfoBox> : null}
        {up ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="First name"><Input value={f.first} onChangeText={v => set({ first: v })} autoComplete="given-name" /></Field></View>
              <View style={{ flex: 1 }}><Field label="Last name"><Input value={f.last} onChangeText={v => set({ last: v })} autoComplete="family-name" /></Field></View>
            </View>
            <Field label="Phone"><Input value={f.phone} onChangeText={v => set({ phone: v })} keyboardType="phone-pad" autoComplete="tel" /></Field>
          </>
        ) : null}
        <Field label="Email">
          <Input value={f.email} onChangeText={v => set({ email: v })} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        </Field>
        <Field label="Password">
          <Input value={f.pw} onChangeText={v => set({ pw: v })} secureTextEntry placeholder="At least 8 characters" autoComplete={up ? 'new-password' : 'password'} textContentType={up ? 'newPassword' : 'password'} onSubmitEditing={submit} />
        </Field>
        <ErrorBox>{err}</ErrorBox>
        <View style={{ flexDirection: 'row' }}><Btn title={busy ? 'Please wait…' : up ? 'Create Account' : 'Sign In'} onPress={busy ? undefined : submit} /></View>
        {up ? null : <LinkBtn title="Forgotten password?" onPress={forgot} style={{ alignSelf: 'flex-start' }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <T s={14} c={C.meta}>{up ? 'Already have an account?' : 'New to Stark?'}</T>
          <LinkBtn title={up ? 'Sign in' : 'Create an account'} onPress={() => { setMode(up ? 'in' : 'up'); setErr(''); setInfo(''); }} />
        </View>
      </ScrollView>
      <OverlayHost tabBarHeight={insets.bottom} />
    </KeyboardAvoidingView>
  );
}
