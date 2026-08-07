# Brew Log

A mobile-first brewing journal for filter and espresso. Log dose, water, grind and time,
record how the cup tasted, and let an assistant read the whole log and tell you what to change next.

- **Framework** — Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Database & auth** — Supabase (Postgres with Row Level Security)
- **AI** — OpenRouter, model set by an environment variable
- **Hosting** — Vercel

## Why Postgres and not Vercel Blob

Vercel Blob is file storage, like S3. It has no queries, no filters, no relations and no
transactions, so "show me every espresso at 18 g in July" would mean downloading the whole file
and filtering in memory — and two devices saving at once would overwrite each other. Supabase
gives you a real Postgres database, user accounts, and Row Level Security that enforces
"you only ever see your own rows" inside the database itself, not just in application code.
Both the free tiers of Supabase and Vercel are far more than this app needs.

---

## Setup

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project. Pick the region closest to you.
2. Open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
   This creates the `profiles`, `brews` and `chat_messages` tables, the row-level security policies,
   and the trigger that creates a profile the moment someone registers.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

Optional but recommended while you're the only user: under **Authentication → Providers → Email**,
turn **Confirm email** off so a new account can sign in immediately.

### 2. Get an OpenRouter key

Create one at [openrouter.ai/keys](https://openrouter.ai/keys) and top up a few dollars.

The model is set by `OPENROUTER_MODEL`; it ships as `anthropic/claude-sonnet-5`. To switch models,
change that one line — nothing else in the code names a model. Any slug from
[openrouter.ai/models](https://openrouter.ai/models) works.

### 3. Run it locally

```bash
cp .env.example .env.local   # then fill in the four values
npm install
npm run dev
```

Open <http://localhost:3000>, create an account, and log a brew.

To try it on your phone while developing, run `npm run dev` and open the **Network** URL that Next
prints (for example `http://192.168.1.10:3000`) on a phone on the same Wi-Fi.

### 4. Deploy to Vercel

```bash
npx vercel
```

Or push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new). Then add the
environment variables under **Project Settings → Environment Variables**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `OPENROUTER_API_KEY` | your OpenRouter key |
| `OPENROUTER_MODEL` | `anthropic/claude-sonnet-5` |
| `OPENROUTER_SITE_URL` | your deployed URL, e.g. `https://brew-log.vercel.app` |
| `OPENROUTER_SITE_NAME` | `Brew Log` |

Finally, in Supabase under **Authentication → URL Configuration**, add your Vercel URL as the
**Site URL** so confirmation links point at the right place.

On your phone, open the deployed URL in Safari or Chrome and choose **Add to Home Screen** — it
runs full-screen like an installed app.

---

## What's in it

| Screen | Path | What it does |
| --- | --- | --- |
| Brews | `/` | Every entry, newest first. Search across names and notes, filter by filter/espresso. |
| Log | `/new` | The entry form. `?from=<id>` prefills the recipe from an earlier brew. |
| Brew | `/brew/[id]` | Full readout, plus **Brew again** and **Edit**. |
| Insights | `/insights` | Computed stats, what your high-scoring cups have in common, and an on-demand AI read of the log. |
| Ask | `/chat` | Chat with the assistant. It receives your whole log with every question, and the conversation is saved. |
| Export | `/export` | CSV, JSON, and a print-ready table. |

Every AI call sends your brew log as context and asks for changes to one variable at a time.
The prompt lives in `src/lib/ai-context.ts` — edit it to change how the advice reads.

### The data model

`brews` holds one row per cup or shot: date, coffee name, roaster, origin, roast type
(filter/espresso), grinder, grind setting, method, dose, water, temperature, time, four 1–5 taste
scales, a 1–10 score, taste notes, what to improve, and comments. The `my_suggestions` view feeds
the form's autocomplete with everything you've typed before, so the same bag gets the same
spelling every time.

## Project layout

```
src/
  app/
    (app)/            authenticated screens, wrapped in the header + tab bar
    api/chat          streaming chat, saves both sides of the conversation
    api/insights      streaming one-shot review of the log
    api/export        CSV and JSON download
    actions.ts        server actions for saving and deleting brews
    login/            sign in and registration
  components/         form fields, the ratio bar, chat, markdown renderer
  lib/
    brew.ts           domain types, ratios, formatting
    stats.ts          the computed numbers on the Insights screen
    ai-context.ts     system prompt and the log dump sent to the model
    openrouter.ts     OpenRouter client
    supabase/         browser and server clients
  proxy.ts            refreshes the session and gates every route behind auth
supabase/schema.sql   run this once in the Supabase SQL editor
```
