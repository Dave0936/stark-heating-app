import { Image, Linking, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Btn, Eyebrow, FeedList, JobCard, Screen, Section, T, Tap } from '../../components/ui';
import { useNav } from '../../components/RoleShell';
import { startBooking, useCustomer } from '../../data/useCustomer';
import { jobCard } from '../../data/selectors';
import { totals } from '../../data/actions';
import { OPEN } from '../../data/catalog';
import { diffDays, fl, fStamp, money, todayIso } from '../../lib/format';
import { BUSINESS, C, tel } from '../../theme';

const HERO = require('../../../assets/images/hero-team-van.jpg');

export default function CustomerHome() {
  const { db, cid, me, props, apps, jobs } = useCustomer();
  const nav = useNav();
  const T0 = todayIso();

  const boilers = apps.filter(a => /boiler/i.test(a.type) && a.next).sort((a, b) => a.next.localeCompare(b.next));
  const b0 = boilers[0];
  const activeSvc = jobs.find(j => j.svc === 'Annual boiler service' && OPEN(j.status));
  const dd = b0 ? diffDays(T0, b0.next) : 0;
  const attention = db.quotes.filter(q => q.cid === cid && q.status === 'Issued');
  const active = jobs.filter(j => OPEN(j.status));
  const notifs = db.notifs.filter(n => n.cid === cid).slice(0, 4);
  const home = props[0];

  const openNotif = (n: (typeof notifs)[number]) => {
    if (n.go === 'quote') router.push(`/customer/quote/${n.p}`);
    else if (n.go === 'doc') router.push(`/customer/doc/${n.p}`);
    else if (n.go === 'job') router.push(`/customer/job/${n.p}`);
    else if (n.go === 'book') startBooking('Annual boiler service');
  };

  const quick: [string, () => void][] = [
    ['Book A Service', () => startBooking()],
    ['Report A Problem', () => startBooking('Boiler repair')],
    ['Request A Quote', () => startBooking('New boiler installation')],
    ['Service History', () => nav.goTab('bookings?tab=past')],
    ['Documents', () => nav.goTab('documents')],
    ['Properties', () => nav.goTab('properties')],
  ];

  return (
    <Screen bare>
      <View style={{ height: 190, backgroundColor: C.ink }}>
        <Image source={HERO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']} locations={[0.3, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 }}>
          <T s={24} w="700" c={C.white}>Hello, {me.first}</T>
          {home ? <T s={13} c={C.white}>{home.addr}, {home.town}</T> : null}
        </View>
      </View>

      <View style={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 28, gap: 20 }}>
        {b0 ? (
          <View style={{ backgroundColor: C.ink, borderRadius: 4, padding: 18, gap: 8 }}>
            <Eyebrow c={C.white}>Next boiler service</Eyebrow>
            <T s={24} w="700" c={C.white}>{fl(b0.next)}</T>
            <T s={14} c={C.white}>{b0.make} {b0.model} · {dd < 0 ? 'Overdue by ' + -dd + ' days' : 'Due in ' + dd + ' days'}</T>
            {activeSvc ? (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <Btn variant="secondary" title={`Service request ${activeSvc.ref}: ${jobCard(db, activeSvc, 'c').pill.text}`} onPress={() => router.push(`/customer/job/${activeSvc.id}`)} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <Btn title="Book Your Service" onPress={() => startBooking('Annual boiler service')} />
              </View>
            )}
          </View>
        ) : null}

        {attention.length ? (
          <Section title="Needs your attention">
            {attention.map(q => {
              const j = db.jobs.find(x => x.id === q.jid);
              return (
                <Tap key={q.id} onPress={() => router.push(`/customer/quote/${q.id}`)} pressedStyle={{ backgroundColor: '#f9d9df' }}
                  style={{ backgroundColor: C.redTint, borderRadius: 4, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <T s={15} w="700" c={C.redDark}>Quotation {q.ref} is ready</T>
                    <T s={13}>{j?.svc} · {money(totals(q.lines, q.vat).total)} inc. VAT</T>
                  </View>
                  <T s={20} c={C.red}>›</T>
                </Tap>
              );
            })}
          </Section>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {quick.map(([label, onPress]) => (
            <Tap key={label} onPress={onPress} pressedStyle={{ backgroundColor: C.pressed }}
              style={{ width: '48.5%', flexGrow: 1, backgroundColor: C.surfaceAlt, borderRadius: 4, paddingVertical: 16, paddingHorizontal: 12, minHeight: 64, justifyContent: 'center' }}>
              <T s={14} w="700">{label}</T>
            </Tap>
          ))}
        </View>

        {active.length ? (
          <Section title="Current bookings">
            {active.map(j => <JobCard key={j.id} j={jobCard(db, j, 'c')} onPress={() => router.push(`/customer/job/${j.id}`)} />)}
          </Section>
        ) : null}

        {notifs.length ? (
          <Section title="Updates">
            <FeedList items={notifs.map(n => ({ t: n.t, at: fStamp(n.at), onPress: n.go ? () => openNotif(n) : undefined }))} />
          </Section>
        ) : null}

        <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 4, padding: 16, gap: 6 }}>
          <T s={15} w="700">Need to talk to us?</T>
          <T s={13} c={C.meta}>{BUSINESS.hours}</T>
          <Tap onPress={() => Linking.openURL(tel(BUSINESS.phone))} style={{ minHeight: 44, justifyContent: 'center' }}>
            <T s={17} w="700" c={C.red}>{BUSINESS.phone}</T>
          </Tap>
        </View>
      </View>
    </Screen>
  );
}
