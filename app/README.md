# Stark Heating & Gas app

Expo (SDK 57) / React Native implementation of the Claude Design handoff `project/Stark App.dc.html`. It is one app with two roles that share a single set of records:

- **Customer:** home with next-service countdown, 5-step service request, bookings (current and history), booking detail with reschedule and cancel requests, accept or decline quotations, properties and appliances, add property, documents, account and notification settings, gas-emergency advice.
- **Owner:** dashboard counts, jobs by status, customer search and landlord portfolio, 7-day calendar, scheduling that blocks double-booking an engineer, start, awaiting parts and complete, completion record (report goes to the customer's Documents and the next service date updates), internal notes, quote builder with revisions, invoices with manual payments, service reminders, and settings for which services customers can request.

## Run it

```bash
npm install
npx expo start          # then press i / a / w, or scan with Expo Go
npm run typecheck
npx expo lint
```

Data lives in the Supabase project **Stark Gas and Heating** (eu-west-2). The project URL and publishable key are in `src/lib/supabase.ts`; you can override them with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`.

### Accounts

- **Customers** tap *Create an account* in the app. When they confirm their email, the database creates their customer record. If the owner already holds a record with that email, it's linked instead.
- **The owner (staff)** is set up by adding their email to `staff_invites` *before* they sign up:
  ```sql
  insert into public.staff_invites (email, name) values ('owner@example.com', 'Owner');
  ```
  When that email confirms, it becomes a staff account and opens the owner app.

## Structure

```
src/
  app/                 Expo Router routes
    sign-in.tsx        sign in, create account, reset password (routes to the customer or owner app)
    customer/          customer tabs + detail screens (_layout = shell)
    owner/             owner tabs + detail screens
  components/
    RoleShell.tsx      app bar, stack, custom tab bar; tapping a tab resets the stack (as in the design)
    ui.tsx             design primitives: text, buttons, chips, fields, cards, pills, rows
    overlay.tsx        bottom-sheet confirm dialog and toast
    DateField.tsx      native date picker (typed YYYY-MM-DD on web)
  data/
    types.ts, catalog.ts   record types, services, slots, status labels and pill colours
    store.ts           loads everything the signed-in user may see; realtime reload; sign in/out
    actions.ts         calls the server functions (one per action)
  lib/supabase.ts      Supabase client (session kept in AsyncStorage)
  lib/format.ts        date and money formatting (en-GB, no Intl dependency)
  theme.ts             colours, fonts, business phone numbers
supabase/migrations/   schema, row-level security and server functions (all applied to the project)
```

### How the data is protected

- Row-level security on every table: a customer can read only their own properties, jobs, quotes, invoices, documents and notifications; internal notes, the activity feed and reminders are staff-only.
- Customers can edit only their own contact details and add properties directly. Everything else (booking, cancel/reschedule requests, accepting quotes, and every owner action) goes through a server function that checks the caller's role and the job's status, then writes the history, notification and activity entry in one transaction.
- The database itself refuses to double-book an engineer in a slot.

## Differences from the prototype

- The design shows both phones side by side. Here they are one app, and your account decides which side opens. Sign Out is in Account (customer) and Settings (owner).
- The logo is a PNG rasterised from `project/assets/logo.svg` at 3x.
- The radiator replacement tile still loads its Unsplash photo from the web, as in the prototype.

## Not real yet

Email and SMS notifications (customers see notifications in the app only), push notifications, online payments, PDF download, and photo upload storage (photo names are recorded, not the files). Owners can't create invoices or add appliances in the app yet; the prototype didn't include those screens, so for now add them in the Supabase table editor. Owner Settings lists what isn't set up yet. The phone number `01506 000 000` is the design's placeholder, set in `src/theme.ts`; the design-system README gives `01506 243550` as the company number.
