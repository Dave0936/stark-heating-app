import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { C } from '../theme';
import { D, fl, iso } from '../lib/format';
import { Btn, Input, T } from './ui';

/** A date input holding an ISO "YYYY-MM-DD" value: native picker on iOS and
 *  Android, typed entry on web. */
export function DateField({ value, onChange, minimumDate }: { value: string; onChange: (v: string) => void; minimumDate?: string }) {
  const [open, setOpen] = useState(false);
  const min = minimumDate ? D(minimumDate) : undefined;

  if (Platform.OS === 'web') {
    return <Input value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" autoCapitalize="none" />;
  }

  const show = () => {
    const current = value ? D(value) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode: 'date', minimumDate: min, onChange: (e, d) => { if (e.type === 'set' && d) onChange(iso(d)); } });
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={show} style={{ borderWidth: 1, borderColor: C.inputBorder, padding: 12, minHeight: 46, borderRadius: 4, justifyContent: 'center', backgroundColor: C.white }}>
        <T s={15}>{value ? fl(value) : 'Choose a date'}</T>
      </Pressable>
      {open && Platform.OS === 'ios' ? (
        <View style={{ gap: 8 }}>
          <DateTimePicker value={value ? D(value) : new Date()} mode="date" display="inline" minimumDate={min} accentColor={C.blue} onChange={(_, d) => { if (d) onChange(iso(d)); }} />
          <View style={{ flexDirection: 'row' }}><Btn variant="secondary" title="Done" onPress={() => setOpen(false)} /></View>
        </View>
      ) : null}
    </View>
  );
}
