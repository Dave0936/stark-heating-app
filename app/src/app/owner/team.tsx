import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Btn, Card, Empty, ErrorBox, Field, InfoBox, Input, LinkBtn, Screen, Section, T, Tag } from '../../components/ui';
import { confirm, run, toast } from '../../components/overlay';
import { inviteStaff, listTeam, removeTeamMember, type TeamMember } from '../../data/actions';
import { C } from '../../theme';

export default function Team() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', err: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listTeam().then(t => { setTeam(t); setLoadErr(''); }).catch(e => setLoadErr((e as Error).message));
  }, []);
  useFocusEffect(load);

  const invite = async () => {
    const email = f.email.trim().toLowerCase();
    if (!f.name.trim()) return setF(x => ({ ...x, err: 'Enter their name.' }));
    if (!/^\S+@\S+\.\S+$/.test(email)) return setF(x => ({ ...x, err: 'Enter a valid email address.' }));
    setBusy(true);
    try {
      const res = await inviteStaff(email, f.name.trim());
      setF({ name: '', email: '', err: '' });
      toast(res === 'added' ? 'They already had an account, so they’re an owner now.' : 'Invitation saved');
      load();
    } catch (e) {
      setF(x => ({ ...x, err: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  };

  const remove = (m: TeamMember) => confirm({
    title: m.kind === 'owner' ? `Remove ${m.name}?` : 'Cancel this invitation?',
    body: m.kind === 'owner'
      ? `${m.email} will lose access to the owner app straight away. Their account stays, so you can invite them again later.`
      : `${m.email} won’t become an owner when they sign up.`,
    yes: m.kind === 'owner' ? 'Remove Access' : 'Cancel Invitation',
    onYes: () => { run(removeTeamMember(m.email), m.kind === 'owner' ? 'Access removed' : 'Invitation cancelled').then(load); },
  });

  const owners = team?.filter(m => m.kind === 'owner') ?? [];
  const invites = team?.filter(m => m.kind === 'invite') ?? [];

  return (
    <Screen>
      <ErrorBox>{loadErr}</ErrorBox>
      <Section title="Owners">
        {team === null && !loadErr ? <Empty s={14}>Loading…</Empty> : null}
        {owners.map(m => (
          <Card key={m.email} gap={4}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <T s={15} w="700" style={{ flex: 1 }}>{m.name}</T>
              {m.is_me ? <Tag text="You" bg={C.ink} fg={C.white} /> : null}
            </View>
            <T s={13} c={C.meta}>{m.email}</T>
            {m.is_me ? null : <LinkBtn title="Remove access" color={C.red} onPress={() => remove(m)} style={{ alignSelf: 'flex-start' }} />}
          </Card>
        ))}
      </Section>

      {invites.length ? (
        <Section title="Invited">
          {invites.map(m => (
            <Card key={m.email} gap={4}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <T s={15} w="700" style={{ flex: 1 }}>{m.name}</T>
                <Tag text="Waiting to sign up" />
              </View>
              <T s={13} c={C.meta}>{m.email}</T>
              <LinkBtn title="Cancel invitation" color={C.red} onPress={() => remove(m)} style={{ alignSelf: 'flex-start' }} />
            </Card>
          ))}
        </Section>
      ) : null}

      <Card style={{ borderWidth: 2, borderColor: C.blue }}>
        <T s={16} w="700">Invite an owner</T>
        <Field label="Name"><Input value={f.name} onChangeText={v => setF(x => ({ ...x, name: v, err: '' }))} autoComplete="name" /></Field>
        <Field label="Email"><Input value={f.email} onChangeText={v => setF(x => ({ ...x, email: v, err: '' }))} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></Field>
        <ErrorBox>{f.err}</ErrorBox>
        <View style={{ flexDirection: 'row' }}><Btn variant="blue" title={busy ? 'Saving…' : 'Send Invite'} onPress={busy ? undefined : invite} /></View>
      </Card>
      <InfoBox>The app doesn’t email the invitation yet, so let them know. They tap Create an account with this email; once they confirm it, they get the owner app. Owners see every customer and job.</InfoBox>
    </Screen>
  );
}
