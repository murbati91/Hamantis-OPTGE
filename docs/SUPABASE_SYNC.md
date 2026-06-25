# Cloud sync setup (Supabase)

Optional, opt-in backup/sync of **your owned collection, decks, matches, and
tournaments** across devices. The app stays local-first; sync only runs when you
configure it and sign in. ~5 minutes, one time.

## 1. Create the project (dashboard)

On the **New project** form (org `hamantis`):
- **Project name:** `hamantis-wallet`
- **Compute size:** Micro (default)
- **Database password:** click *Generate a password* and save it somewhere
- **Region:** Asia-Pacific → **Mumbai (ap-south-1)** (closest to Bahrain)
- **Security:** leave **Enable Data API** checked. (RLS below protects your data.)

Click **Create new project** and wait ~2 minutes for it to provision.

## 2. Run this SQL once

Open **SQL Editor → New query**, paste, and **Run**:

```sql
-- One row per owned card copy
create table if not exists public.collection (
  user_id    uuid not null references auth.users (id) on delete cascade,
  card_id    text not null,
  quantity   int  not null default 1,
  condition  text not null default 'NM',
  language   text not null default 'EN',
  note       text,
  image_url  text,
  added_at   bigint not null,
  updated_at bigint not null,
  primary key (user_id, card_id)
);

-- Your own cards / decks / matches / tournaments, stored as JSON payloads
create table if not exists public.cards       (user_id uuid not null references auth.users(id) on delete cascade, id text not null, payload jsonb not null, primary key (user_id, id));
create table if not exists public.decks       (user_id uuid not null references auth.users(id) on delete cascade, id text not null, payload jsonb not null, primary key (user_id, id));
create table if not exists public.matches     (user_id uuid not null references auth.users(id) on delete cascade, id text not null, payload jsonb not null, primary key (user_id, id));
create table if not exists public.tournaments (user_id uuid not null references auth.users(id) on delete cascade, id text not null, payload jsonb not null, primary key (user_id, id));

-- Row-level security: each user sees and writes ONLY their own rows
do $$
declare t text;
begin
  foreach t in array array['collection','cards','decks','matches','tournaments'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$create policy %I on public.%I for all to authenticated
                       using (user_id = auth.uid()) with check (user_id = auth.uid());$p$,
                   t || '_own', t);
  end loop;
end $$;
```

(Re-running is safe except the policy creation — if it errors "already exists",
the policies are already in place; ignore it.)

## 3. Enable the 6-digit email code

The app signs you in with a passwordless **6-digit code**. Supabase's default
email contains a magic *link* instead, so add the code to the template:

**Authentication → Emails → Magic Link** (template), make sure the body includes:

```
Your Hamantis sign-in code is: {{ .Token }}
```

(You can keep the link too — clicking it also works.) Email auth is on by default.

## 4. Connect the app

In Supabase: **Project Settings → API**, copy:
- **Project URL** (`https://xxxx.supabase.co`)
- **anon public** key (`eyJ…`)

In the app: **Settings → Cloud sync** — paste both, enter your email, **Send code**,
type the code from the email, **Verify**. Then:
- **Push to cloud** — back up this device.
- **Pull from cloud** — restore/merge on another device (after signing in there with
  the same email).

Sync is **last-write-wins per row**. Imported reference cards (OP01–OP16 etc.) are
**not** synced — they're re-importable and would bloat the DB; only *your* data goes up.
