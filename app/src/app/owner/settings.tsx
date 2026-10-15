import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Screen, Section, T, Tag, Toggle } from '../../components/ui';
import { run } from '../../components/overlay';
import { signOut, useDB } from '../../data/store';
import { toggleCategory } from '../../data/actions';
import { CATEGORIES } from '../../data/catalog';
import { C } from '../../theme';

const INTEGRATIONS: [string, string, string][] = [
  ['Email (transactional)', 'Not configured', 'Needs provider API key'],
  ['SMS', 'Not configured', 'Needs provider account'],
  ['Push notifications', 'Not configured', 'Needs Expo push credentials'],
  ['Online payments', 'Not configured', 'Needs payment provider account'],
  ['PDF generation', 'Not configured', 'Server function required'],
  ['Database & accounts', 'Connected', 'Supabase · Stark Gas and Heating'],
  ['File storage', 'Not configured', 'Needed for photo and PDF uploads'],
];

export default function Settings() {
  const db = useDB();
  return (
    <Screen>
      <Section title="Services customers can request" gap={6}>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
          {CATEGORIES.map(ct => <Toggle key={ct.k} label={ct.k} on={db.settings.cats[ct.k] !== false} onPress={() => run(toggleCategory(db, ct.k))} />)}
        </View>
      </Section>
      <Section title="Integrations" gap={8}>
        {INTEGRATIONS.map(([label, st, sub]) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flex: 1, gap: 2 }}><T s={14} w="600">{label}</T><T s={12} c={C.meta}>{sub}</T></View>
            <Tag text={st} />
          </View>
        ))}
      </Section>
      <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Sign Out" onPress={async () => { await signOut(); router.replace('/sign-in'); }} /></View>
    </Screen>
  );
}
