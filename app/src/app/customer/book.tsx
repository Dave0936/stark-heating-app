import { useMemo, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Btn, Chips, ErrorBox, Eyebrow, Field, Input, InfoBox, KVRows, Screen, T, Tap, LinkBtn } from '../../components/ui';
import { useCustomer } from '../../data/useCustomer';
import { CATEGORIES, REPAIR_CATEGORIES, type Category } from '../../data/catalog';
import { submitBooking } from '../../data/actions';
import { C } from '../../theme';

const HEADINGS = ['', 'Which property?', 'What do you need?', 'Tell us more', 'Add photos', 'Check and send'];
const PREFS = ['Weekday mornings', 'Weekday afternoons', 'Any time'] as const;
const YN = ['Yes', 'No'] as const;

export default function BookFlow() {
  const { db, props, apps } = useCustomer();
  const [busy, setBusy] = useState(false);
  const params = useLocalSearchParams<{ cat?: string }>();
  const scroll = useRef<ScrollView>(null);
  const single = props.length === 1;

  const [b, setB] = useState({
    step: single ? 2 : 1, pid: single ? props[0].id : '', cat: params.cat ?? '', aid: '', desc: '', fault: '',
    heating: '', hot: '', pref: '', access: props[0]?.access ?? '', files: [] as string[], err: '',
  });
  const set = (patch: Partial<typeof b>) => setB(x => ({ ...x, ...patch, err: '' }));
  const go = (step: number) => { setB(x => ({ ...x, step, err: '' })); scroll.current?.scrollTo({ y: 0, animated: false }); };

  const enabled = CATEGORIES.filter(ct => db.settings.cats[ct.k] !== false);
  const isRep = REPAIR_CATEGORIES.includes(b.cat);
  const papps = apps.filter(a => a.pid === b.pid);
  const appOpts = useMemo(() => papps.map(a => a.id).concat(['none']), [papps]);
  const appLabel = (id: string) => { const a = papps.find(x => x.id === id); return a ? a.type + ' · ' + a.make : 'Not sure'; };

  const p = props.find(x => x.id === b.pid);
  const a = papps.find(x => x.id === b.aid);
  const review = ([
    ['Property', p ? p.nick + ' · ' + p.addr : ''], ['Service', b.cat], ['Appliance', a ? a.make + ' ' + a.model : b.aid === 'none' ? 'Not sure' : ''],
    ['Heating working', isRep ? b.heating : ''], ['Hot water working', isRep ? b.hot : ''], ['Fault code', b.fault], ['Details', b.desc],
    ['Preferred times', b.pref], ['Access', b.access], ['Photos', b.files.length ? b.files.length + ' attached' : ''],
  ] as [string, string][]).filter(r => r[1]).map(([k, v]) => ({ k, v }));

  const next = () => {
    let err = '';
    if (b.step === 1 && !b.pid) err = 'Choose a property.';
    if (b.step === 2 && !b.cat) err = 'Choose a service.';
    if (b.step === 3) {
      if (!b.aid) err = 'Choose an appliance, or Not sure.';
      else if (isRep && (!b.heating || !b.hot)) err = 'Tell us whether heating and hot water are working.';
      else if (isRep && b.desc.trim().length < 10) err = 'Describe the problem in a few words (10+ characters).';
      else if (!b.pref) err = 'Choose your preferred times.';
    }
    if (err) return setB(x => ({ ...x, err }));
    go(b.step + 1);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { id } = await submitBooking({ pid: b.pid, cat: b.cat, aid: b.aid, desc: b.desc, fault: b.fault, heating: isRep ? b.heating : '', hot: isRep ? b.hot : '', pref: b.pref, access: b.access, files: b.files });
      router.replace(`/customer/book-done/${id}`);
    } catch (e) {
      setB(x => ({ ...x, err: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  };

  if (props.length === 0) {
    return (
      <Screen>
        <T s={24} w="700">Add your property first</T>
        <T s={15} c={C.meta}>Tell us where the boiler is and you can request a service straight away.</T>
        <View style={{ flexDirection: 'row' }}><Btn title="Add A Property" onPress={() => router.replace('/customer/add-property')} /></View>
      </Screen>
    );
  }

  const pickPhotos = async () => {
    const room = 6 - b.files.length;
    if (room <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: room, quality: 0.7 });
    if (res.canceled) return;
    const names = res.assets.map((x, i) => x.fileName || 'Photo ' + (b.files.length + i + 1));
    set({ files: b.files.concat(names).slice(0, 6) });
  };

  const catCard = (ct: Category) => {
    const sel = ct.k === b.cat;
    return (
      <Tap key={ct.k} onPress={() => set({ cat: ct.k })} label={ct.k}
        style={{ width: '48.5%', flexGrow: 1, backgroundColor: sel ? C.blue : C.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 92, backgroundColor: '#ccc' }}>{ct.img ? <Image source={ct.img} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}</View>
        <View style={{ padding: 10, gap: 2, borderTopWidth: 3, borderTopColor: sel ? C.blue : C.red }}>
          <T s={14} w="700" lh={18} c={sel ? C.white : C.ink}>{ct.k}</T>
          <T s={12} c={sel ? C.white : C.ink}>{ct.d}</T>
        </View>
      </Tap>
    );
  };

  return (
    <Screen ref={scroll}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= b.step ? C.red : C.pressed }} />)}
      </View>
      <View style={{ gap: 4 }}>
        <T s={12} w="600" c={C.meta}>Step {b.step} of 5</T>
        <T s={24} w="700">{HEADINGS[b.step]}</T>
      </View>

      {b.step === 1 ? (
        <View style={{ gap: 8 }}>
          {props.map(pr => {
            const sel = pr.id === b.pid;
            return (
              <Tap key={pr.id} onPress={() => set({ pid: pr.id, aid: '', access: pr.access })} style={{ backgroundColor: sel ? C.blue : C.surfaceAlt, borderRadius: 4, padding: 16, gap: 3 }}>
                <T s={16} w="700" c={sel ? C.white : C.ink}>{pr.nick}</T>
                <T s={13} c={sel ? C.white : C.ink}>{pr.addr}, {pr.town}</T>
              </Tap>
            );
          })}
        </View>
      ) : null}

      {b.step === 2 ? (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{enabled.filter(c => c.featured).map(catCard)}</View>
          <Eyebrow>More services</Eyebrow>
          <View style={{ gap: 6 }}>
            {enabled.filter(c => !c.featured).map(ct => {
              const sel = ct.k === b.cat;
              return (
                <Tap key={ct.k} onPress={() => set({ cat: ct.k })} style={{ backgroundColor: sel ? C.blue : C.surfaceAlt, borderRadius: 4, paddingVertical: 13, paddingHorizontal: 14, gap: 2, minHeight: 48 }}>
                  <T s={15} w="700" c={sel ? C.white : C.ink}>{ct.k}</T>
                  <T s={12} c={sel ? C.white : C.ink}>{ct.d}</T>
                </Tap>
              );
            })}
          </View>
        </View>
      ) : null}

      {b.step === 3 ? (
        <View style={{ gap: 18 }}>
          <Field label="Which appliance?"><Chips options={appOpts} value={b.aid} onChange={v => set({ aid: v })} labels={appLabel} /></Field>
          {isRep ? (
            <>
              <Field label="Is the heating working?"><Chips options={YN} value={b.heating as never} onChange={v => set({ heating: v })} /></Field>
              <Field label="Is the hot water working?"><Chips options={YN} value={b.hot as never} onChange={v => set({ hot: v })} /></Field>
              <Field label="Fault code on the display (optional)"><Input value={b.fault} onChangeText={v => set({ fault: v })} placeholder="e.g. F22" autoCapitalize="characters" /></Field>
            </>
          ) : null}
          <Field label={isRep ? 'Describe the problem' : 'Anything we should know? (optional)'}><Input rows={4} value={b.desc} onChangeText={v => set({ desc: v })} /></Field>
          <Field label="When suits you?"><Chips options={PREFS} value={b.pref as never} onChange={v => set({ pref: v })} /></Field>
          <Field label="Access notes"><Input rows={2} value={b.access} onChangeText={v => set({ access: v })} /></Field>
        </View>
      ) : null}

      {b.step === 4 ? (
        <View style={{ gap: 12 }}>
          <T s={14} c={C.meta}>Photos of the boiler, its display or the problem help the engineer arrive prepared. Optional, up to 6.</T>
          <Tap onPress={pickPhotos} style={{ backgroundColor: C.surfaceAlt, borderWidth: 2, borderStyle: 'dashed', borderColor: C.inputBorder, borderRadius: 4, padding: 24, alignItems: 'center' }}>
            <T s={15} w="700">Choose Photos</T>
          </Tap>
          {b.files.length ? (
            <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
              {b.files.map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line, gap: 8 }}>
                  <T s={14} numberOfLines={1} style={{ flex: 1 }}>{f}</T>
                  <LinkBtn title="Remove" color={C.red} onPress={() => set({ files: b.files.filter((_, k) => k !== i) })} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {b.step === 5 ? (
        <View style={{ gap: 14 }}>
          <KVRows rows={review} />
          <InfoBox>This is a request, not a confirmed appointment. We’ll confirm a date and time with you.</InfoBox>
        </View>
      ) : null}

      <ErrorBox>{b.err}</ErrorBox>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {b.step > 1 ? <Btn variant="secondary" title="Back" onPress={() => go(b.step - 1)} /> : null}
        {b.step < 5 ? <Btn title="Continue" onPress={next} /> : <Btn title={busy ? 'Sending…' : 'Send Request'} onPress={submit} />}
      </View>
    </Screen>
  );
}
