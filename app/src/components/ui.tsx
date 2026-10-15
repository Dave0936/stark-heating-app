import React, { forwardRef, useState } from 'react';
import {
  Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type ScrollViewProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { C, fontFor, type Weight } from '../theme';
import type { PillProps } from '../data/catalog';

// ---------- text ----------

type TProps = { s?: number; w?: Weight; c?: string; lh?: number; style?: StyleProp<TextStyle>; children?: React.ReactNode; numberOfLines?: number; center?: boolean };
export function T({ s = 15, w = '400', c = C.ink, lh, style, children, numberOfLines, center }: TProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: fontFor(w), fontSize: s, color: c, lineHeight: lh ?? Math.round(s * 1.35) }, center && { textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}
export const H2 = ({ children, s = 24 }: { children: React.ReactNode; s?: number }) => <T s={s} w="700">{children}</T>;
export const Eyebrow = ({ children, c = C.ink, style }: { children: React.ReactNode; c?: string; style?: StyleProp<TextStyle> }) => (
  <T s={12} w="700" c={c} style={[{ letterSpacing: 1.2, textTransform: 'uppercase' }, style]}>{children}</T>
);
export const Meta = ({ children, s = 13, w = '400' as Weight }: { children: React.ReactNode; s?: number; w?: Weight }) => <T s={s} w={w} c={C.meta}>{children}</T>;

// ---------- layout ----------

/** Standard scrolling screen body: 20/16/28 padding, 20px gaps. */
export const Screen = forwardRef<ScrollView, ScrollViewProps & { bare?: boolean; gap?: number }>(function Screen({ children, bare, gap = 20, contentContainerStyle, ...rest }, ref) {
  return (
    <ScrollView ref={ref} style={{ flex: 1, backgroundColor: C.white }} keyboardShouldPersistTaps="handled" contentContainerStyle={[!bare && { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 28, gap }, contentContainerStyle]} {...rest}>
      {children}
    </ScrollView>
  );
});
export const Stack = ({ gap = 10, children, style }: { gap?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ gap }, style]}>{children}</View>;
export const Row = ({ gap = 10, children, style }: { gap?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
export const Section = ({ title, children, gap = 10, titleColor }: { title: string; children: React.ReactNode; gap?: number; titleColor?: string }) => (
  <View style={{ gap }}><Eyebrow c={titleColor}>{title}</Eyebrow>{children}</View>
);
export const Card = ({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[s.card, { gap }, style]}>{children}</View>
);

// ---------- buttons ----------

type BtnVariant = 'primary' | 'secondary' | 'blue' | 'danger';
type BtnProps = { title: string; onPress?: () => void; variant?: BtnVariant; flex?: boolean; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style' | 'children'>;
export function Btn({ title, onPress, variant = 'primary', flex = true, style, ...rest }: BtnProps) {
  const v = BTN[variant];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.btn, v.box, flex && { flex: 1 }, pressed && v.pressed, style]} {...rest}>
      <T s={15} w="600" c={v.fg} center>{title}</T>
    </Pressable>
  );
}
const BTN: Record<BtnVariant, { box: ViewStyle; pressed: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: C.red, paddingVertical: 15 }, pressed: { backgroundColor: C.redDark }, fg: C.white },
  blue: { box: { backgroundColor: C.blue, paddingVertical: 15 }, pressed: { backgroundColor: '#004293' }, fg: C.white },
  secondary: { box: { backgroundColor: C.white, borderWidth: 2, borderColor: C.ink, paddingVertical: 13 }, pressed: { backgroundColor: C.surfaceAlt }, fg: C.ink },
  danger: { box: { backgroundColor: C.white, borderWidth: 2, borderColor: C.red, paddingVertical: 13 }, pressed: { backgroundColor: C.redTint }, fg: C.red },
};

export function LinkBtn({ title, onPress, color = C.blue, s: size = 14, style }: { title: string; onPress?: () => void; color?: string; s?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={({ pressed }) => [{ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 }, style]}>
      <T s={size} w="600" c={color}>{title}</T>
    </Pressable>
  );
}

/** Generic pressable surface with the design's press feedback. */
export function Tap({ onPress, style, pressedStyle, children, disabled, label }: { onPress?: () => void; style?: StyleProp<ViewStyle>; pressedStyle?: StyleProp<ViewStyle>; children: React.ReactNode; disabled?: boolean; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [style, pressed && (pressedStyle ?? { opacity: 0.85 })]}>
      {children}
    </Pressable>
  );
}

// ---------- choice chips ----------

export function Chips<V extends string>({ options, value, onChange, labels }: { options: readonly V[]; value: V | '' | undefined; onChange: (v: V) => void; labels?: (v: V) => string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const sel = o === value;
        return (
          <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: sel }} onPress={() => onChange(o)} style={({ pressed }) => [s.chip, { backgroundColor: sel ? C.blue : pressed ? C.pressed : C.surfaceAlt }]}>
            <T s={14} w="600" c={sel ? C.white : C.ink}>{labels ? labels(o) : o}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- form fields ----------

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ gap: 6 }}><T s={13} w="600">{label}</T>{children}</View>
);
export const Input = forwardRef<TextInput, TextInputProps & { rows?: number }>(function Input({ rows, style, editable = true, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={C.muted}
      editable={editable}
      multiline={!!rows}
      textAlignVertical={rows ? 'top' : 'center'}
      onFocus={e => { setFocused(true); onFocus?.(e); }}
      onBlur={e => { setFocused(false); onBlur?.(e); }}
      style={[s.input, rows ? { minHeight: Math.max(46, rows * 22 + 24) } : null, !editable && { backgroundColor: C.surfaceAlt }, focused && s.inputFocus, style]}
      {...rest}
    />
  );
});
export const ErrorBox = ({ children }: { children?: React.ReactNode }) =>
  children ? <View style={s.err}><T s={14} w="600" c={C.redDark}>{children}</T></View> : null;
export const InfoBox = ({ children, bg = C.surfaceAlt, c = C.meta, w = '400' as Weight }: { children: React.ReactNode; bg?: string; c?: string; w?: Weight }) => (
  <View style={{ backgroundColor: bg, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 4 }}><T s={14} c={c} w={w}>{children}</T></View>
);

export function Toggle({ label, sub, on, onPress }: { label: string; sub?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} style={s.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <T s={15} w="600">{label}</T>
        {sub ? <T s={12} c={C.meta}>{sub}</T> : null}
      </View>
      <View style={[s.track, { backgroundColor: on ? C.red : C.toggleOff }]}>
        <View style={[s.knob, { left: on ? 22 : 2 }]} />
      </View>
    </Pressable>
  );
}

export function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
      <View style={[s.check, { backgroundColor: checked ? C.red : C.white }]}>{checked ? <T s={15} w="700" c={C.white} lh={18}>✓</T> : null}</View>
      <T s={14} w="600" style={{ flex: 1 }}>{label}</T>
    </Pressable>
  );
}

// ---------- data display ----------

export const Pill = ({ text, bg, fg }: PillProps) => (
  <View style={{ backgroundColor: bg, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 3 }}>
    <T s={11} w="700" c={fg} lh={13} style={{ letterSpacing: 0.3 }} numberOfLines={1}>{text}</T>
  </View>
);
export const Tag = ({ text, bg = C.surfaceAlt, fg = C.ink, small }: { text: string; bg?: string; fg?: string; small?: boolean }) => (
  <View style={{ backgroundColor: bg, paddingVertical: small ? 4 : 5, paddingHorizontal: small ? 6 : 8, borderRadius: 3, alignSelf: 'center' }}>
    <T s={small ? 10 : 11} w="700" c={fg} lh={small ? 12 : 13} numberOfLines={1}>{text}</T>
  </View>
);

/** Bordered list card used for jobs, documents, invoices, quotes and customers. */
export function ListCard({ onPress, children, gap = 5 }: { onPress?: () => void; children: React.ReactNode; gap?: number }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.listCard, { gap }, pressed && { borderColor: C.ink }]}>
      {children}
    </Pressable>
  );
}
export const CardHead = ({ left, pill: p, leftSize = 12, leftWeight = '600' as Weight, leftColor = C.meta }: { left: string; pill?: PillProps; leftSize?: number; leftWeight?: Weight; leftColor?: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
    <T s={leftSize} w={leftWeight} c={leftColor} style={{ flexShrink: 1 }}>{left}</T>
    {p ? <Pill {...p} /> : null}
  </View>
);

export type JobCardVM = { ref: string; svc: string; who?: string; when: string; place: string; pill: PillProps };
export function JobCard({ j, onPress, showWho }: { j: JobCardVM; onPress: () => void; showWho?: boolean }) {
  return (
    <ListCard onPress={onPress}>
      <CardHead left={j.ref} pill={j.pill} />
      <T s={16} w="600">{j.svc}</T>
      {showWho && j.who ? <T s={13} w="600">{j.who}</T> : null}
      <Meta>{j.when}</Meta>
      <Meta>{j.place}</Meta>
    </ListCard>
  );
}

/** Key/value rows separated by hairlines. */
export function KVRows({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
      {rows.map((r, i) => (
        <View key={i} style={{ gap: 3, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <T s={12} w="600" c={C.meta}>{r.k}</T>
          <T s={15}>{r.v}</T>
        </View>
      ))}
    </View>
  );
}

/** Priced line items with subtotal, VAT and total (quotes and invoices). */
export function LineItems({ lines, sub, vatLabel, vat, total }: { lines: { d: string; qty: string; amt: string }[]; sub: string; vatLabel: string; vat: string; total: string }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
      {lines.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <View style={{ flex: 1, gap: 3 }}><T s={14}>{l.d}</T><T s={12} c={C.meta}>{l.qty}</T></View>
          <T s={14} w="600">{l.amt}</T>
        </View>
      ))}
      <View style={s.sumRow}><T s={14}>Subtotal</T><T s={14}>{sub}</T></View>
      <View style={[s.sumRow, { paddingTop: 4 }]}><T s={14}>{vatLabel}</T><T s={14}>{vat}</T></View>
      <View style={s.totalRow}><T s={18} w="700">Total</T><T s={18} w="700">{total}</T></View>
    </View>
  );
}

export function Timeline({ items }: { items: { t: string; at: string }[] }) {
  return (
    <View>
      {items.map((h, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, paddingBottom: 14 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === 0 ? C.red : '#ccc', marginTop: 4 }} />
          <View style={{ flex: 1, gap: 2 }}><T s={14}>{h.t}</T><T s={12} c={C.meta}>{h.at}</T></View>
        </View>
      ))}
    </View>
  );
}

/** Hairline-separated tappable feed rows (updates, recent activity). */
export function FeedList({ items, compact }: { items: { t: string; at: string; onPress?: () => void }[]; compact?: boolean }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
      {items.map((n, i) => (
        <Pressable key={i} disabled={!n.onPress} onPress={n.onPress} style={({ pressed }) => [{ paddingVertical: compact ? 11 : 12, borderBottomWidth: 1, borderBottomColor: C.line, gap: 3 }, pressed && { opacity: 0.6 }]}>
          <T s={14}>{n.t}</T>
          <T s={12} c={C.meta}>{n.at}</T>
        </Pressable>
      ))}
    </View>
  );
}

export const Empty = ({ children, s: size = 15 }: { children: React.ReactNode; s?: number }) => <T s={size} c={C.meta}>{children}</T>;

const LOGO = require('../../assets/images/logo.png');
const LOGO_RATIO = 990 / 340;
export const Logo = ({ height = 30, style }: { height?: number; style?: StyleProp<any> }) => (
  <Image source={LOGO} accessibilityLabel="Stark Heating & Gas" style={[{ height, width: height * LOGO_RATIO }, style]} resizeMode="contain" />
);

const s = StyleSheet.create({
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16 },
  btn: { minHeight: 48, borderRadius: 4, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, borderRadius: 4, justifyContent: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: C.inputBorder, padding: 12, fontSize: 15, minHeight: 46, borderRadius: 4, color: C.ink, backgroundColor: C.white, fontFamily: fontFor('400') },
  // 2px Stark-blue focus ring from the design; padding drops by 1 so text doesn't shift.
  inputFocus: { borderWidth: 2, borderColor: C.blue, padding: 11, outlineWidth: 0 } as TextStyle,
  err: { backgroundColor: C.redTint, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, minHeight: 52 },
  track: { width: 48, height: 28, borderRadius: 14 },
  knob: { position: 'absolute', top: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: C.white },
  check: { width: 24, height: 24, borderWidth: 2, borderColor: C.red, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  listCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14, width: '100%' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 2, borderTopColor: C.ink, marginTop: 6 },
});
