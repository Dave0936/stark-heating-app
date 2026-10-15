import React, { useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { Btn, T } from './ui';

// Bottom-sheet confirmation dialog and a short-lived toast, shared by both apps.

type Dialog = { title: string; body: string; yes: string; onYes: () => void } | null;
let dialog: Dialog = null;
let toastMsg = '';
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
const sub = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

export function confirm(d: NonNullable<Dialog>) { dialog = d; emit(); }
export function closeDialog() { dialog = null; emit(); }
export function toast(msg: string) {
  toastMsg = msg;
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => { toastMsg = ''; emit(); }, 2800);
}

/** Run a server action: toast `ok` on success or the error message on failure. Resolves true on success. */
export async function run(action: Promise<unknown>, ok?: string): Promise<boolean> {
  try {
    await action;
    if (ok) toast(ok);
    return true;
  } catch (e) {
    toast((e as Error).message || 'Something went wrong. Please try again.');
    return false;
  }
}

/** Renders over the whole role layout (header, screen and tab bar). */
export function OverlayHost({ tabBarHeight }: { tabBarHeight: number }) {
  const d = useSyncExternalStore(sub, () => dialog, () => dialog);
  const msg = useSyncExternalStore(sub, () => toastMsg, () => toastMsg);
  const insets = useSafeAreaInsets();
  return (
    <>
      {d ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'flex-end', zIndex: 20 }}>
          <Pressable style={{ flex: 1 }} onPress={closeDialog} accessibilityLabel="Close" />
          <View accessibilityViewIsModal style={{ backgroundColor: C.white, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom, gap: 12 }}>
            <T s={20} w="700">{d.title}</T>
            <T s={15} lh={23} c={C.ink2}>{d.body}</T>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" title="Go Back" onPress={closeDialog} />
              <Btn title={d.yes} onPress={() => { closeDialog(); d.onYes(); }} />
            </View>
          </View>
        </View>
      ) : null}
      {msg ? (
        <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 16, right: 16, bottom: tabBarHeight + 14, backgroundColor: C.ink, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 4, zIndex: 30 }}>
          <T s={14} w="600" c={C.white}>{msg}</T>
        </View>
      ) : null}
    </>
  );
}
