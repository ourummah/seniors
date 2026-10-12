# Seniors Money Finder: marketing website

A one-page static website (plain HTML and CSS, no build step) that explains Seniors Money Finder and collects waitlist sign-ups.

- `index.html` is the whole site.
- `favicon.svg` is the browser tab icon.
- `vercel.json` sets clean URLs and two basic security headers.

## Deploy to Vercel

Import this folder's GitHub repo at vercel.com/new (Framework preset "Other", no build command), or run `npx vercel` in this folder and then `npx vercel --prod`.

## Before going live

1. **Waitlist form.** Sign-ups are not saved yet. Create a form endpoint (for example Formspree, Basin or a Vercel function) and paste its URL into `FORM_ENDPOINT` near the bottom of `index.html`.
2. **Statistics.** The $3B, 1 in 4 and 40+ figures come from the concept doc and investor deck (Retirement Essentials research via CFS; The Mercury). Check the original sources before launch.
3. **Example card.** The "Margaret" results card in the hero is an illustration and is labelled "Example only".
4. **Legal.** Have the disclaimer and privacy wording reviewed, and add a privacy policy page and contact details.
