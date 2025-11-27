# Quick Start: Deploy to Vercel + Supabase

## Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- Supabase account (sign up at supabase.com)

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/caseflow.git
git push -u origin main
```

## Step 2: Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `caseflow-prod`
3. Set a strong database password (save it!)
4. Wait ~2 minutes for project to be ready
5. Go to **Settings → Database → Connection String**
6. Copy the **Connection pooling** URI (port 6543)
7. Replace `[YOUR-PASSWORD]` with your database password

## Step 3: Deploy to Vercel

### Option A: Via Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `apps/web`
4. Add environment variables:
   - `DATABASE_URL` = Your Supabase connection string
   - `NEXTAUTH_SECRET` = Run `openssl rand -base64 32`
   - `NEXTAUTH_URL` = Will be your Vercel URL (update after first deploy)
   - `AUTH_TRUST_HOST` = `true`
5. Click **Deploy**

### Option B: Via CLI

```bash
npm install -g vercel
vercel login
vercel
# Follow prompts, then:
vercel --prod
```

## Step 4: Run Database Setup

```bash
# Set environment variable (use your Supabase connection string)
$env:DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres"

# Push database schema
cd packages/database
npx prisma db push

# Seed admin users
cd ../..
pnpm exec tsx scripts/create-admin.ts
```

## Step 5: Update NEXTAUTH_URL

After deployment, Vercel gives you a URL like `https://caseflow-abc123.vercel.app`

1. Go to Vercel project → **Settings → Environment Variables**
2. Update `NEXTAUTH_URL` with your actual Vercel URL
3. **Redeploy** (Deployments → ⋮ → Redeploy)

## Step 6: Test

Visit your Vercel URL → `/login`

Login with:

- **Email:** admin@caseflow.com
- **Password:** admin123

🎉 **You're live!**

---

## Troubleshooting

**Build fails:** Check Vercel build logs. Usually a TypeScript error.

**Database connection fails:** Make sure you're using the **connection pooling** URL (port 6543) from Supabase, not the direct connection (port 5432).

**NextAuth error:** Ensure `NEXTAUTH_URL` exactly matches your Vercel URL (no trailing slash).

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
