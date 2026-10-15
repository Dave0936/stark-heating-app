import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Btn, LineItems, Pill, Screen, Section, T, Tap } from '../../../components/ui';
import { confirm, run } from '../../../components/overlay';
import { useDB } from '../../../data/store';
import { decideQuote, totals } from '../../../data/actions';
import { customerQuotePill, lineRows } from '../../../data/selectors';
import { fl, fStamp, money } from '../../../lib/format';
import { BUSINESS, C, tel } from '../../../theme';

export default function CustomerQuote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const q = db.quotes.find(x => x.id === id);
  if (!q) return <Screen><T>This quotation no longer exists.</T></Screen>;
  const t = totals(q.lines, q.vat);
  const j = db.jobs.find(x => x.id === q.jid);

  const decide = (d: 'Accepted' | 'Declined') => {
    run(decideQuote(q.id, d), d === 'Accepted' ? "Quote accepted. We'll be in touch to arrange a date." : 'Quote declined');
  };
  const accept = () => confirm({
    title: 'Accept quotation ' + q.ref + '?',
    body: "You're accepting version " + q.ver + ' for ' + money(t.total) + " including VAT. We'll contact you to arrange a date; accepting doesn't book an appointment.",
    yes: 'Accept Quote', onYes: () => decide('Accepted'),
  });
  const decline = () => confirm({
    title: 'Decline this quotation?',
    body: "We'll let Stark know. You can still get in touch if you change your mind.",
    yes: 'Decline Quote', onYes: () => decide('Declined'),
  });

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <T s={13} w="600" c={C.meta}>{q.ref} · Version {q.ver}</T>
          <Pill {...customerQuotePill(q)} />
        </View>
        <T s={24} w="700">{j?.svc ?? ''}</T>
        <T s={13} c={C.meta}>Issued {fl(q.issued)} · valid until {fl(q.expires)}</T>
      </View>
      <LineItems lines={lineRows(q.lines)} sub={money(t.sub)} vatLabel={'VAT (' + q.vat + '%)'} vat={money(t.v)} total={money(t.total)} />
      {q.excl.length ? (
        <Section title="Not included" gap={6}>
          {q.excl.map((e, i) => <T key={i} s={14} c={C.ink2}>– {e}</T>)}
        </Section>
      ) : null}
      {q.decision ? (
        <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 4, padding: 14 }}>
          <T s={14}>{q.decision.d} by {q.decision.by} on {fStamp(q.decision.at)} (version {q.decision.ver})</T>
        </View>
      ) : null}
      {q.status === 'Issued' ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row' }}><Btn title="Accept Quote" onPress={accept} /></View>
          <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Decline" onPress={decline} /></View>
          <Tap onPress={() => Linking.openURL(tel(BUSINESS.phone))}>
            <T s={13} c={C.meta}>Questions about this quote? Call {BUSINESS.phone}.</T>
          </Tap>
        </View>
      ) : null}
    </Screen>
  );
}
