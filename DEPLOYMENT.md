# CaseFlow Deployment Guide - Vercel + Supabase

## 🚀 Complete Deployment in 15 Minutes

This guide will walk you through deploying CaseFlow to **Vercel** (for Next.js hosting) and **Supabase** (for PostgreSQL database).

---

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)
- Node.js 20+ installed
- pnpm installed

---

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/caseflow.git
git branch -M main
git push -u origin main
```

---

## Step 2: Setup Supabase Database

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `caseflow-prod`
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

### 2.2 Get Database Connection String

1. In your Supabase project dashboard, go to **Settings → Database**
2. Scroll to **Connection String → URI**
3. Copy the **Connection pooling** string (it starts with `postgresql://`)
4. Replace `[YOUR-PASSWORD]` with your database password

**Example:**

```
postgresql://postgres.abc123xyz:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Important:** Use the **Connection pooling** string (port 6543), not the direct connection (port 5432). This prevents connection limit issues with serverless.

### 2.3 Test Connection Locally (Optional)

```bash
# Set environment variable
$env:DATABASE_URL="your-supabase-connection-string"

# Test connection
pnpm --filter @caseflow/db exec prisma db pull
```

---

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Deploy

```bash
# From your project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? caseflow
# - In which directory is your code? ./apps/web
# - Want to override settings? No

# This creates a preview deployment
# To deploy to production:
vercel --prod
```

**Alternative: Deploy via Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm install && pnpm turbo run build --filter=web`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`
4. Click **"Deploy"**

---

## Step 4: Configure Environment Variables

### 4.1 Add Environment Variables in Vercel

Go to your project in Vercel → **Settings → Environment Variables**

Add the following variables:

#### Required Variables

| Variable          | Value                                                            | Environment                      |
| ----------------- | ---------------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL`    | Your Supabase connection string                                  | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32`                          | Production, Preview, Development |
| `NEXTAUTH_URL`    | Your Vercel deployment URL (e.g., `https://caseflow.vercel.app`) | Production                       |
| `AUTH_TRUST_HOST` | `true`                                                           | Production, Preview, Development |

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 4.2 Set Production URL

After your first deployment, Vercel will give you a URL like `https://caseflow-abc123.vercel.app`

Update the `NEXTAUTH_URL` environment variable with this URL.

### 4.3 Redeploy After Adding Variables

In Vercel dashboard → **Deployments** → Click ⋮ on latest deployment → **Redeploy**

---

## Step 5: Run Database Migrations

### Option A: Via Local Machine (Recommended First Time)

```bash
# Set environment variable
$env:DATABASE_URL="your-supabase-connection-string"

# Navigate to database package
cd packages/database

# Push schema to Supabase
npx prisma db push

# Or if you want to use migrations:
npx prisma migrate deploy
```

### Option B: Via GitHub Actions (Automated)

The included `.github/workflows/deploy.yml` will run migrations automatically on every push to `main`.

**Setup:**

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add secret:
   - Name: `DATABASE_URL`
   - Value: Your Supabase connection string
3. Push to main branch

---

## Step 6: Seed Admin Users

```bash
# Set environment variable
$env:DATABASE_URL="your-supabase-connection-string"

# Run seed script
pnpm exec tsx scripts/create-admin.ts
```

**You should see:**

```
Admin & Operator created!
```

**Created users:**

- Admin: `admin@caseflow.com` / `admin123`
- Operator: `operator@caseflow.com` / `user123`

---

## Step 7: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Go to `/login`
3. Login with: `admin@caseflow.com` / `admin123`
4. You should see the dashboard!

---

## 🔧 Optional: Custom Domain

### Add Custom Domain in Vercel

1. Go to your project → **Settings → Domains**
2. Add your domain (e.g., `caseflow.example.com`)
3. Follow DNS instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain
5. Redeploy

---

## 🔄 Continuous Deployment

### Automatic Deployments

Every push to your GitHub repository will automatically:

1. Trigger a Vercel build
2. Run migrations (via GitHub Actions)
3. Deploy to production (if on `main` branch)

### Preview Deployments

Every pull request gets a preview deployment with a unique URL for testing.

---

## 📊 Monitoring & Logs

### View Logs in Vercel

1. Go to your project in Vercel
2. Click **Deployments**
3. Click on a deployment
4. View **Build Logs** or **Function Logs**

### View Database in Supabase

1. Go to Supabase dashboard
2. **Table Editor** → View your data
3. **SQL Editor** → Run custom queries
4. **Database** → View connection info

---

## 🐛 Troubleshooting

### Build Fails with "Cannot find module '@caseflow/db'"

**Solution:** Update Vercel build settings:

- **Build Command:** `cd ../.. && pnpm install && pnpm turbo run build --filter=web`
- **Install Command:** `pnpm install`

### Database Connection Error: "Too many connections"

**Solution:** You're using the direct connection instead of connection pooling.

In Supabase → **Settings → Database → Connection String**, use the **Connection pooling** URI (port 6543).

### NextAuth Error: "Callback URL Mismatch"

**Solution:**

1. Ensure `NEXTAUTH_URL` matches your Vercel deployment URL exactly
2. No trailing slash
3. Use `https://` not `http://`

### Prisma Client Not Generated

**Solution:** Add build script to `apps/web/package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema=../../packages/database/prisma/schema.prisma"
  }
}
```

### Environment Variables Not Working

**Solution:**

1. Check they're set for the correct environment (Production/Preview/Development)
2. Redeploy after adding new variables
3. Check for typos in variable names

---

## 💰 Cost Breakdown

### Free Tier Limits

**Vercel Free:**

- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains
- Automatic HTTPS

**Supabase Free:**

- 500 MB database storage
- Unlimited requests
- 2 GB data transfer
- Social OAuth providers

### When to Upgrade

**Vercel Pro ($20/month):**

- Better performance
- Advanced analytics
- Password protection
- Team collaboration

**Supabase Pro ($25/month):**

- 8 GB database storage
- 50 GB data transfer
- Daily backups
- Priority support

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

After first login, change the admin password:

```sql
-- Run in Supabase SQL Editor
UPDATE users
SET password = '$2a$10$NEW_HASHED_PASSWORD'
WHERE email = 'admin@caseflow.com';
```

Or create a password change UI in your app.

### 2. Enable Row Level Security (Optional)

In Supabase → **Authentication** → **Policies**

Add RLS policies to protect your data.

### 3. Set Up Backups

Supabase Pro includes daily backups. For Free tier:

1. Go to **Database → Backups**
2. Click **"Create backup"** manually
3. Or export data via SQL:
   ```sql
   select * from users;
   select * from cases;
   ```

---

## 📈 Performance Optimization

### 1. Enable Edge Functions (Optional)

Vercel automatically deploys your API routes to the edge for better performance.

### 2. Add Database Indexes

Already included in your Prisma schema:

```prisma
@@index([caseId])
@@index([createdAt])
@@index([category])
@@index([priority])
```

### 3. Enable Caching

Add to `apps/web/next.config.mjs`:

```js
export default {
  // ... existing config
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};
```

---

## 🔄 Updating Your Deployment

### Deploy Code Changes

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically deploy
```

### Update Database Schema

```bash
# 1. Update schema in packages/database/prisma/schema.prisma

# 2. Create migration (locally)
cd packages/database
npx prisma migrate dev --name your_migration_name

# 3. Commit the migration
git add .
git commit -m "Add migration"
git push origin main

# 4. GitHub Actions will run the migration automatically
# Or run manually:
$env:DATABASE_URL="your-supabase-url"
npx prisma migrate deploy
```

---

## ✅ Post-Deployment Checklist

- [ ] Application deployed to Vercel
- [ ] Database created in Supabase
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Admin users seeded
- [ ] Login tested successfully
- [ ] Custom domain configured (optional)
- [ ] GitHub Actions working
- [ ] Logs accessible in Vercel
- [ ] Database accessible in Supabase

---

## 🆘 Need Help?

### Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Prisma with Supabase:** https://www.prisma.io/docs/guides/database/supabase

### Common Issues

**Q: My build keeps failing**
A: Check the build logs in Vercel. Usually it's a TypeScript error or missing dependency.

**Q: Database connection works locally but not in Vercel**
A: Make sure you're using the connection pooling URL (port 6543) from Supabase.

**Q: How do I rollback a deployment?**
A: In Vercel → Deployments → Click on a previous working deployment → "Promote to Production"

---

## 🎉 You're Done!

Your CaseFlow application is now live at:

- **Production:** `https://your-app.vercel.app`
- **Database:** Managed by Supabase

**Next steps:**

1. Invite users
2. Import your first CSV
3. Set up monitoring (optional)
4. Add custom domain (optional)

Enjoy your deployed app! 🚀
