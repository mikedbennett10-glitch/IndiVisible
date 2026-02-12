# IndiVisible — Setup Guide

This guide walks you through setting up IndiVisible from scratch: Supabase backend, local development, push notifications, and deployment.

---

## Prerequisites

- **Node.js 18+** and **npm**
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deployment)
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) for Edge Functions

---

## 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Choose a name, database password, and region.
3. Once created, go to **Settings > API** and note:
   - **Project URL** (e.g. `https://abcdef.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret — only used server-side)

---

## 2. Set Up the Database

1. In the Supabase dashboard, go to **SQL Editor**.
2. Open `scripts/setup-database.sql` from this repo.
3. Paste the entire contents into the SQL Editor and click **Run**.

This creates all tables, indexes, RLS policies, triggers, and enables Realtime.

---

## 3. Enable Realtime

1. Go to **Database > Replication** in the Supabase dashboard.
2. Under **supabase_realtime**, verify these tables are enabled:
   - `tasks`, `lists`, `activity_log`, `notifications`, `messages`, `subtasks`
3. The SQL script already adds them, but confirm they appear in the dashboard.

---

## 4. Configure Auth Settings

### Email Confirmations
1. Go to **Authentication > Providers > Email** in the dashboard.
2. **Enable** "Confirm email" — users must verify their email before signing in.

### Redirect URLs
1. Go to **Authentication > URL Configuration**.
2. Add your site URL (e.g. `https://your-app.vercel.app`).
3. Add redirect URLs:
   - `https://your-app.vercel.app/reset-password` (for password reset)
   - `http://localhost:5173/reset-password` (for local development)

---

## 5. Local Development Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd indivisible
   npm install
   ```

2. Create a `.env.local` file from the example:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Supabase credentials in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser.

---

## 6. Generate VAPID Keys (Push Notifications)

VAPID keys are required for web push notifications. Generate them once:

```bash
npm run generate-vapid-keys
```

This outputs a **Public Key** and a **Private Key**.

- **Public Key** → put in `.env.local` as `VITE_VAPID_PUBLIC_KEY`
- **Private Key** → used as an Edge Function secret (see step 8)

---

## 7. Deploy to Vercel

1. Push your code to a GitHub/GitLab repo.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Vite. Default settings work fine:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add these **Environment Variables** in Vercel project settings:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
   - `VITE_VAPID_PUBLIC_KEY` = the VAPID public key from step 6
5. Click **Deploy**.

After deploying, update the **Site URL** in Supabase Auth settings (step 4) to your Vercel domain.

---

## 8. Deploy the Push Notification Edge Function

The Edge Function (`supabase/functions/send-push-notifications`) processes due reminders and sends push notifications.

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link your project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### Set secrets

```bash
supabase secrets set VAPID_SUBJECT=mailto:your@email.com
supabase secrets set VAPID_PUBLIC_KEY=<your-vapid-public-key>
supabase secrets set VAPID_PRIVATE_KEY=<your-vapid-private-key>
```

### Deploy the function

```bash
supabase functions deploy send-push-notifications
```

---

## 9. Set Up the Cron Job

The Edge Function needs to be called periodically to process reminders. Use `pg_cron` for this.

1. In the Supabase dashboard, go to **Database > Extensions**.
2. Search for `pg_cron` and **enable** it.
3. Also enable `pg_net`.
4. Go to **SQL Editor** and run (replace the placeholders):

```sql
select cron.schedule(
  'send-push-notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

This calls the Edge Function every minute to check for due reminders.

### Verify the cron job

```sql
select * from cron.job;
```

---

## 10. Test the Full Setup

1. **Sign up** with a real email — you should receive a verification email.
2. **Verify** your email by clicking the link.
3. **Create a household** and share the invite code with your partner.
4. **Create lists and tasks** — they should sync in real-time.
5. **Set a reminder** on a task — you should get a notification within a minute.
6. **Enable push notifications** in Settings — test by setting a reminder for 1 minute from now.
7. **Try "Forgot password"** from the login page — check email for reset link.
8. **Open the chat** — send messages and verify they appear in real-time.

---

## Troubleshooting

### "Email not confirmed" error on login
- Make sure you clicked the verification link in your email.
- Check your spam folder.
- In Supabase Auth settings, you can temporarily disable "Confirm email" for testing.

### Push notifications not working
- Ensure VAPID keys are correctly set (env var + Edge Function secrets).
- Check that the Edge Function is deployed: `supabase functions list`.
- Verify the cron job is running: `select * from cron.job_run_details order by start_time desc limit 5;`.
- Check Edge Function logs: `supabase functions logs send-push-notifications`.

### Realtime not syncing
- Verify tables are added to the `supabase_realtime` publication in Database > Replication.
- Check browser console for WebSocket errors.

### Password reset link not working
- Ensure your site URL and redirect URLs are correctly configured in Auth settings.
- The redirect URL must exactly match (including trailing slash behavior).
