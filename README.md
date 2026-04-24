# Kent Disc Golf

Season standings + badge tracker for the Kent County disc golf group.

## What it does

- **Current badge** — whoever won the most recent round holds the "Currently" badge (★). If the current holder doesn't play, whoever wins the next round takes it.
- **Season standings** — every round earns points: **(N − position + 1)** where N is the number of players (ties split points). Players who sit out just don't earn that round's points.
- **Season champion** — the player with the most wins at season end keeps the season badge in the history page.
- **UDisc import** — paste a public UDisc round URL, the site tries to parse finishing order and pre-fill the form. Falls back to manual entry.
- **Share to Messenger** — each round page has a pre-formatted summary with medals you can copy and paste into the group chat. (Meta's API doesn't allow auto-posting to group chats.)

## One-time setup

### 1. Push the code to GitHub

```bash
cd disc-golf-site
git init
git add .
git commit -m "initial"
# create a new repo on github.com, then:
git remote add origin https://github.com/<you>/kent-disc-golf.git
git push -u origin main
```

### 2. Deploy to Vercel

- Go to [vercel.com/new](https://vercel.com/new) and import the repo.
- Framework preset: **Next.js** (auto-detected).
- Before the first deploy, set these environment variables (Project Settings → Environment Variables):
  - `ADMIN_PASSWORD` — password for adding rounds / editing roster.
  - `KV_REST_API_URL` and `KV_REST_API_TOKEN` — see step 3.

### 3. Add persistent storage (Upstash Redis, free)

Without this, the site still works but data resets on every deploy. To make it persistent:

- In your Vercel project → **Storage** → **Create Database** → **Marketplace** → pick **Upstash** → **Redis**.
- Connect it to the project. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into the env. Redeploy.
- Free tier is more than enough (10,000 commands/day).

### 4. First visit

- The site seeds 9 players from the Facebook group and records 2025 as Jeffrey Rijkse's championship year (no detailed stats).
- Go to `/admin`, sign in with your `ADMIN_PASSWORD`, and either add the first round or tweak the roster.

## Day-to-day use

1. After a group round, go to `/admin` → **+ Add round**.
2. Paste the UDisc round URL, click **Preview**. The site tries to match UDisc names to roster players.
3. Review the positions, hit **Save round**.
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
cp .env.local.example .env.local   # set ADMIN_PASSWORD; leave KV vars blank for in-memory mode
npm run dev
```

Visit http://localhost:3000.

## Tech

- Next.js 15 (App Router, Server Actions)
- Tailwind CSS
- Upstash Redis (via `@upstash/redis`)
- Deployed on Vercel free tier
