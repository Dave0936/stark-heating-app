import { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { hydrate, useReady } from '../data/store';
import { C } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold });
  const ready = useReady();
  const loaded = (fontsLoaded || !!fontError) && ready;

  useEffect(() => { hydrate(); }, []);
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);

  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.white }, animation: 'fade' }} />
    </SafeAreaProvider>
  );
}
