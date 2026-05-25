# Room Reserve - Vercel PostgreSQL Edition

This version is prepared for Vercel. It does not use SQLite, so it will not crash because of local database files.

## What changed

- API moved to `api/[...path].js` for Vercel serverless functions.
- SQLite was removed.
- PostgreSQL support was added through `DATABASE_URL`.
- If `DATABASE_URL` is missing, the site still opens in demo memory mode, but data is not guaranteed to persist.
- Admin cannot book as a customer.
- Booking includes phone number only, without Gmail, SMS, or external messages.

## Vercel deployment

1. Upload this folder to GitHub.
2. Import it into Vercel.
3. Framework Preset: Other.
4. Build Command: leave empty or use `npm install`.
5. Output Directory: leave empty.
6. Install Command: `npm install`.
7. Add environment variable for persistent data:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

You can get `DATABASE_URL` from Neon, Supabase, Vercel Postgres, or any PostgreSQL provider.

If you do not add `DATABASE_URL`, the website can open, but data will be demo memory data only.

## Local run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Admin login

```text
Email: admin@roomreserve.com
Password: Admin@12345
```


## Vercel fixed public deployment
Static files are inside `public/` so Vercel opens the home page from `/` automatically. API functions remain inside `api/`.


## Session / Neon fix
This version accepts Vercel Neon variables such as DATABASE_POSTGRES_URL and does not redirect users back to login because of a temporary /api/me refresh failure.


## Login persistence fix
This version prevents the login page from showing a false 'email is not registered' message when a saved browser session exists and Vercel/Neon needs a moment to wake up.


## Latest fixes
- Added Arabic / English language switch.
- Added strict Egyptian mobile number validation: 010/011/012/015 or +2010/+2011/+2012/+2015.
- Prevented duplicate booking submissions from the button and from the backend.
- After one successful booking, the Confirm Booking button is locked and the booking reference is shown once.
