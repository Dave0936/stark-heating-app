// Stark Heating & Gas design tokens, as used by the app design (Stark App.dc.html).
export const C = {
  red: '#bd122e',
  redDark: '#93101f',
  redTint: '#fdecef',
  blue: '#0257bd',
  blueTint: '#e6efff',
  ink: '#333333',
  ink2: '#444444',
  meta: '#555555',
  muted: '#777777',
  surfaceAlt: '#efefef',
  pressed: '#e2e2e2',
  line: '#e2e2e2',
  border: '#dddddd',
  inputBorder: '#bbbbbb',
  toggleOff: '#cccccc',
  note: '#fff8e1',
  white: '#ffffff',
  frame: '#1c1c1c',
};

export const F = {
  regular: 'Montserrat_400Regular',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};

export type Weight = '400' | '600' | '700';
export const fontFor = (w: Weight = '400') => (w === '700' ? F.bold : w === '600' ? F.semibold : F.regular);

/** Business details. 01506 000 000 is the placeholder from the design; the
 *  design-system README lists 01506 243550 as the company's number. */
export const BUSINESS = {
  phone: '01506 000 000',
  hours: 'Mon–Fri, 8am–4pm',
  emergencyPhone: '0800 111 999',
};
export const tel = (n: string) => 'tel:' + n.replace(/\s/g, '');
