import { Linking, View } from 'react-native';
import { InfoBox, Screen, Section, T, Tap } from '../../components/ui';
import { BUSINESS, C, tel } from '../../theme';

const STEPS = [
  "Turn off the gas at the meter if it's safe to do so.",
  'Open doors and windows.',
  "Don't use electrical switches, naked flames or anything that could make a spark.",
  'Leave the property and wait outside.',
  'If anyone feels unwell (headache, dizziness, nausea) get medical help and suspect carbon monoxide.',
];

export default function Emergency() {
  return (
    <Screen>
      <View style={{ backgroundColor: C.red, borderRadius: 4, padding: 18, gap: 8 }}>
        <T s={20} w="700" c={C.white}>If you smell gas</T>
        <T s={15} lh={22} c={C.white}>Call the National Gas Emergency Service now, free, 24 hours.</T>
        <Tap onPress={() => Linking.openURL(tel(BUSINESS.emergencyPhone))} pressedStyle={{ backgroundColor: C.redTint }} style={{ backgroundColor: C.white, padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 4 }}>
          <T s={20} w="700" c={C.red}>Call {BUSINESS.emergencyPhone}</T>
        </Tap>
      </View>
      <Section title="While you wait">
        {STEPS.map(s => <T key={s} s={15} lh={22}>{s}</T>)}
      </Section>
      <InfoBox>Stark Heating &amp; Gas is not an emergency service. Once the gas network has made the supply safe, we can arrange a repair.</InfoBox>
    </Screen>
  );
}
