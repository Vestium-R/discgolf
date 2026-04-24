# Disc Golf League

Season standings + badge tracker for a friend group.

## What it does

- **Current badge** — whoever won the most recent round holds the "Currently" badge (★). If the current holder doesn't play, whoever wins the next round takes it.
- **Season standings** — every round earns points: **(N − position + 1)** where N is the number of players (ties split points). Players who sit out just don't earn that round's points.
- **Season champion** — the player with the most wins at season end is saved to the history page.
- **UDisc import** — paste a public UDisc round URL, the site tries to parse finishing order and pre-fill the form. Falls back to manual entry.
- **Share to Messenger** — each round page has a pre-formatted summary with medals you can copy and paste into the group chat. (Meta's API doesn't allow auto-posting to group chats.)
- **Sign-in via email** — no passwords. Enter your email, get a one-time link. Admin emails (set in env) can add rounds; others can view.

## One-time setup

### 1. Push the code to GitHub

Already done. Repo: https://github.com/Vestium-R/discgolf

### 2. Set up Supabase (free)

- Go to [supabase.com](https://supabase.com) and create a new project. Save the database password.
- Once the project is ready, open **SQL Editor** → **New query** and run the two files in `supabase/migrations/` in order:
  1. `001_init.sql` — creates tables and enables RLS
  2. `002_seed.sql` — seeds the 9 players, 2025 champion, and current season
- Go to **Project Settings → API** and copy three values:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
- Go to **Authentication → URL Configuration** and add your Vercel URL to **Site URL** and **Redirect URLs** (e.g. `https://your-app.vercel.app/auth/callback`). You can add `http://localhost:3000/auth/callback` too for local dev.

### 3. Deploy to Vercel

- Go to [vercel.com/new](https://vercel.com/new), import `Vestium-R/discgolf`.
- Framework preset: **Next.js** (auto-detected).
- Before the first deploy, set env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAILS` — comma-separated emails allowed to add rounds / edit roster
- Deploy. Visit the URL, click **Admin**, enter your email, check inbox, click the link — you're in.

### 4. Adding more admins later

- Edit `ADMIN_EMAILS` in Vercel → Project → Settings → Environment Variables, add another email, redeploy.
- That person signs in with magic link from the `/admin` page.

## Day-to-day use

1. After a group round, go to `/admin` → **+ Add round**.
2. Paste the UDisc round URL, click **Preview**. The site tries to match UDisc names to roster players.
3. Review positions, hit **Save round**.
4. On the round page, click **Share** or **Copy** to grab the summary and paste it in the Messenger group.

## Scoring rules

- Points = `N − position + 1`, where `N` is number of players in that round.
- Ties split the combined points (tied for 1st in a 5-player round = (5 + 4)/2 = 4.5 each).
- Examples:
  - 2 players → 1st=2, 2nd=1
  - 3 players → 1st=3, 2nd=2, 3rd=1
  - 5 players → 1st=5, 2nd=4, 3rd=3, 4th=2, 5th=1

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in Supabase vars + ADMIN_EMAILS
npm run dev
```

Visit http://localhost:3000.

## Tech

- Next.js 15 (App Router, Server Actions, middleware)
- Tailwind CSS
- Supabase (Postgres + Auth via magic link) — `@supabase/ssr`, `@supabase/supabase-js`
- Deployed on Vercel free tier
