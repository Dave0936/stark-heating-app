import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Project "Stark Gas and Heating". The publishable key is safe to ship in the
// app: every table is protected by row-level security (see supabase/migrations).
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://lsodqfkzughnoayvvimj.supabase.co';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_vakV54x8bvcahJaIb8Rz3Q_LsOuqGld';

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Refresh the session only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
