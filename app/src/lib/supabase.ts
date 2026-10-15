import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Project "Stark Gas and Heating". The publishable key is safe to ship in the
// app: every table is protected by row-level security (see supabase/migrations).
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://lsodqfkzughnoayvvimj.supabase.co';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_vakV54x8bvcahJaIb8Rz3Q_LsOuqGld';

// Email links land on the web app with details in the URL hash. Read it before
// the client consumes and clears it.
const hash = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.slice(1)) : null;
/** The page was opened from a password-reset email. */
export const openedFromRecovery = hash?.get('type') === 'recovery';
/** An email link that failed (usually expired or already used). */
export const linkError = hash?.get('error_code') === 'otp_expired'
  ? 'That email link has expired or was already used. Please request a new one.'
  : hash?.get('error_description')?.replace(/\+/g, ' ') ?? '';

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
