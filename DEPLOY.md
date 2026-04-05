# Deploying LeadFlow (Railway + Supabase)

## Fix: “Something went wrong” on `/login` with Prisma / SQLite error 14

That means the server is still using **`DATABASE_URL=file:...`** (SQLite). SQLite file paths **do not work** on Railway’s filesystem for app data.

### Do this

1. **Supabase** → Project **Settings** → **Database** → copy the **URI** (connection string).  
   Use the **direct** connection on port **5432** (not a local `file:` path).  
   Format: `postgresql://postgres.[password]@db.[project-ref].supabase.co:5432/postgres`

2. **Railway** → your **web** service → **Variables**:
   - Set **`DATABASE_URL`** to that `postgresql://...` string (URL-encode special characters in the password if needed).
   - Remove any old value like `file:./prisma/dev.db`.

3. Set **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, and **`SUPABASE_SERVICE_ROLE_KEY`** from Supabase → **Settings** → **API**.

4. **Redeploy** the service so `npm run start` runs `prisma migrate deploy` against Postgres.

5. Optional: run **`npx prisma db seed`** locally with `DATABASE_URL` pointing at the same Supabase DB if you want demo users/leads.

The app’s Prisma schema targets **PostgreSQL** only; Supabase Auth stays separate (same Supabase project).
