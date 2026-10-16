# Seniors Money Finder

The public website plus a secure members area, business offers portal and admin area.

- `public/index.html`: the public marketing page (served at `/`, unchanged plain HTML).
- `app/login`: log in or join with a 6-digit code by email or text message (no passwords).
- `app/account`: members' questions, matched benefits with dollar estimates, claim steps, printable summary, offers, alerts and family helpers.
- `app/business`: businesses register (ABN checked) and upload seniors offers; every offer is reviewed before it goes live.
- `app/admin`: edit and check benefits (with change history and minutes spent), approve businesses and offers.
- `app/api/cron`: nightly check of every official source page for changes, and daily member alerts.
- `lib/match.ts`: the matching rules (tested in `lib/match.test.ts`).
- `supabase/migrations/0001_init.sql`: database tables and row level security.
- `data/benefits/*.json`: the gathered benefits (federal plus all 8 states and territories). `npm run seed` turns them into `supabase/seed.sql`.

## Setting up (one time)

1. **Supabase.** Create a project in the Sydney region. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
2. **Login codes.** In Supabase, Authentication > Email Templates: in both Magic Link and Confirm signup, put `{{ .Token }}` in the email so people get a 6-digit code. Under Authentication > SMTP, connect Resend so emails come from your domain. For text messages, turn on the Phone provider and connect Twilio.
3. **Vercel.** Add the values from `.env.example` under Project Settings > Environment Variables (tick Production and Preview), then redeploy. New values only apply to deployments built after they were added.
4. **Make yourself admin.** Log in once on the site, then in the SQL editor run:
   `update profiles set role = 'admin' where email = 'you@example.com';`

## Working on it

```
npm install
npm run dev        # http://localhost:3000
npm test           # matching and ABN rules
npm run build
```

## Before public launch

- Max checks every dollar figure (admin area, tick "Checked", log minutes).
- Privacy policy and a legal review of the general-information wording.
- The waitlist form on the public page still needs its `FORM_ENDPOINT`.
