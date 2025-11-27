# Vercel Configuration

## Build Settings

When importing your project to Vercel, use these settings:

### Framework Preset

**Next.js**

### Root Directory

```
apps/web
```

### Build Command

```bash
cd ../.. && pnpm install && pnpm turbo run build --filter=web
```

### Output Directory

```
.next
```

### Install Command

```
pnpm install
```

### Node Version

**20.x**

---

## Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable          | Value                                   | Environments                     |
| ----------------- | --------------------------------------- | -------------------------------- |
| `DATABASE_URL`    | Your Supabase connection pooling URL    | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production, Preview, Development |
| `NEXTAUTH_URL`    | Your Vercel deployment URL              | Production                       |
| `AUTH_TRUST_HOST` | `true`                                  | Production, Preview, Development |

### Example DATABASE_URL:

```
postgresql://postgres.abc123:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Important:** Use the **connection pooling** endpoint (port 6543) from Supabase, not the direct connection.

---

## GitHub Integration

### Automatic Deployments

Every push to `main` automatically deploys to production.

### Preview Deployments

Every pull request gets a preview deployment with a unique URL.

### Required GitHub Secrets

For the automated migration workflow (`.github/workflows/deploy.yml`), add these secrets:

Go to GitHub → Your Repo → Settings → Secrets and variables → Actions

| Secret Name         | Value                               |
| ------------------- | ----------------------------------- |
| `DATABASE_URL`      | Your Supabase connection string     |
| `VERCEL_TOKEN`      | Create at vercel.com/account/tokens |
| `VERCEL_ORG_ID`     | Found in Vercel project settings    |
| `VERCEL_PROJECT_ID` | Found in Vercel project settings    |

---

## Vercel CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Performance Tips

1. **Edge Runtime** (Optional for API routes):

   ```ts
   export const runtime = "edge";
   ```

2. **ISR for static pages** (Already configured):

   ```ts
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

3. **Image Optimization** (Built-in):
   Next.js Image component automatically optimizes images.

---

## Troubleshooting

### Build Error: "Command failed"

Check that your build command includes the monorepo context:

```bash
cd ../.. && pnpm install && pnpm turbo run build --filter=web
```

### Runtime Error: "Prisma Client Not Generated"

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema=../../packages/database/prisma/schema.prisma || true"
  }
}
```

### Database Connection Pooling

Always use Supabase's **connection pooling** endpoint (port 6543) for serverless deployments.

---

## Custom Domain

1. Go to your Vercel project → **Settings → Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable
5. Redeploy
