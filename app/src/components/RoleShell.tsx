import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { Logo, T } from './ui';
import { OverlayHost } from './overlay';

// One stack per app (customer / owner) with a persistent bottom tab bar, as in
// the design: tapping a tab resets the stack to that tab's root screen, and
// detail screens keep the tab bar visible underneath.

export type TabDef = { key: string; label: string };
type Nav = { tab: string; goTab: (key: string, then?: string[]) => void; push: (path: string) => void; base: string };
const NavCtx = createContext<Nav | null>(null);
export const useNav = () => useContext(NavCtx)!;

type Props = {
  base: '/customer' | '/owner';
  tabs: TabDef[];
  titles: Record<string, string>;
  hideTabsOn?: string[];
  right: React.ReactNode;
};

const TAB_BAR_CONTENT = 48 + 3;

export function RoleShell({ base, tabs, titles, hideTabsOn = [], right }: Props) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const rootKey = tabs[0].key;
  const pathFor = useCallback((key: string) => (key === rootKey ? base : base + '/' + key), [base, rootKey]);

  // Screen key = first segment after the base ("job" for /customer/job/j1).
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, '') : '';
  const screen = rest.split('/')[0] || rootKey;
  const isTabRoot = tabs.some(t => t.key === screen) && rest.split('/').length <= 1;

  // The active tab is the screen itself at a tab root, otherwise the tab last chosen.
  const [chosen, setTab] = useState(rootKey);
  const tab = isTabRoot ? screen : chosen;
  if (isTabRoot && chosen !== screen) setTab(screen);

  const nav = useMemo<Nav>(() => ({
    tab,
    base,
    push: (path: string) => router.push((base + '/' + path.replace(/^\//, '')) as never),
    goTab: (target, then = []) => {
      // `target` is a tab key, optionally with a query ("bookings?tab=past").
      const [key, query] = target.split('?');
      setTab(key);
      if (router.canDismiss()) router.dismissAll();
      router.replace((pathFor(key) + (query ? '?' + query : '')) as never);
      then.forEach(p => router.push((base + '/' + p) as never));
    },
  }), [tab, base, pathFor]);

  const showTabs = !hideTabsOn.includes(screen);
  const tabBarHeight = showTabs ? TAB_BAR_CONTENT + Math.max(insets.bottom, 22) : insets.bottom;

  return (
    <NavCtx.Provider value={nav}>
      <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top }}>
        <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line, gap: 8, backgroundColor: C.white }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            {isTabRoot ? <Logo height={30} /> : (
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : nav.goTab(tab))} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingRight: 8 }}>
                <T s={15} w="600">‹ Back</T>
              </Pressable>
            )}
            <T s={15} w="700" numberOfLines={1} style={{ flexShrink: 1 }}>{isTabRoot ? '' : titles[screen] ?? ''}</T>
          </View>
          {right}
        </View>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.white } }} />
        </View>
        {showTabs ? (
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Math.max(insets.bottom, 22), backgroundColor: C.white }}>
            {tabs.map(t => {
              const on = t.key === tab;
              return (
                <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => nav.goTab(t.key)}
                  style={{ flex: 1, minWidth: 0, borderTopWidth: 3, borderTopColor: on ? C.red : 'transparent', paddingTop: 12, paddingBottom: 8, minHeight: 48, alignItems: 'center' }}>
                  <T s={11} w="700" c={on ? C.red : C.meta} numberOfLines={1}>{t.label}</T>
                </Pressable>
              );
            })}
          </View>
        ) : <View style={{ height: insets.bottom }} />}
        <OverlayHost tabBarHeight={tabBarHeight} />
      </View>
    </NavCtx.Provider>
  );
}
