// Supabase Edge Function: Send Push Notifications
// Triggered by pg_cron every minute to process due reminders
//
// Required secrets (set via `supabase secrets set`):
//   VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT
// Auto-injected by Supabase:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webPush from "npm:web-push@3.6.7";

interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  remind_at: string;
  type: string;
  sent: boolean;
  tasks: { title: string } | null;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Service role client bypasses RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Configure web-push if VAPID keys are available
    const pushEnabled = vapidSubject && vapidPublicKey && vapidPrivateKey;
    if (pushEnabled) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

    // Fetch due, unsent reminders with task titles
    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*, tasks(title)")
      .eq("sent", false)
      .lte("remind_at", new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!reminders?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let pushSent = 0;
    let pushFailed = 0;

    for (const reminder of reminders as Reminder[]) {
      const taskTitle = reminder.tasks?.title ?? "a task";

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: reminder.user_id,
        type: "reminder",
        title: "Reminder",
        body: `Reminder for: ${taskTitle}`,
        task_id: reminder.task_id,
      });

      // Send push notifications if VAPID is configured
      if (pushEnabled) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", reminder.user_id);

        for (const sub of (subs ?? []) as PushSubscription[]) {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({
                title: "Indivisible",
                body: `Reminder: ${taskTitle}`,
                tag: `reminder-${reminder.id}`,
                url: `/tasks/${reminder.task_id}`,
              })
            );
            pushSent++;
          } catch (pushErr: unknown) {
            const statusCode =
              pushErr && typeof pushErr === "object" && "statusCode" in pushErr
                ? (pushErr as { statusCode: number }).statusCode
                : null;

            if (statusCode === 410) {
              // Subscription expired, clean up
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
            pushFailed++;
            console.error(
              `Push failed for subscription ${sub.id}:`,
              pushErr instanceof Error ? pushErr.message : pushErr
            );
          }
        }
      }

      // Mark reminder as sent
      await supabase
        .from("reminders")
        .update({ sent: true })
        .eq("id", reminder.id);

      processed++;
    }

    return new Response(
      JSON.stringify({ processed, pushSent, pushFailed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
