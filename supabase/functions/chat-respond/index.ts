// Supabase Edge Function: Chat Respond (AI Assistant "Indi")
// Called by the frontend when a user sends a message that triggers the assistant.
//
// Required secrets (set via `supabase secrets set`):
//   ANTHROPIC_API_KEY
// Auto-injected by Supabase:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HouseholdContext {
  household: { id: string; name: string };
  members: { id: string; display_name: string; email: string }[];
  lists: { id: string; name: string }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    urgency: string;
    status: string;
    due_date: string | null;
    due_time: string | null;
    assigned_to: string | null;
    shared_responsibility: boolean;
    list_id: string;
    recurrence_rule: string | null;
    lists: { name: string } | null;
  }[];
  recentActivity: {
    action: string;
    details: Record<string, unknown>;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];
  currentUserId: string;
  agentTone: string;
}

interface ParsedAction {
  type: string;
  payload: Record<string, unknown>;
}

interface ActionResult {
  type: string;
  success: boolean;
  taskId?: string;
  error?: string;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY secret");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const { household_id, user_id, message_content } = await req.json();

    if (!household_id || !user_id || !message_content) {
      throw new Error("Missing required fields: household_id, user_id, message_content");
    }

    // Rate limit: skip if assistant responded <5 seconds ago
    const { data: recentAssistant } = await supabase
      .from("messages")
      .select("id, created_at")
      .eq("household_id", household_id)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentAssistant?.length) {
      const lastTime = new Date(recentAssistant[0]!.created_at).getTime();
      if (Date.now() - lastTime < 5000) {
        return new Response(
          JSON.stringify({ message: null, skipped: "rate_limited" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Gather context in parallel
    const context = await gatherContext(supabase, household_id, user_id);

    // Check for welcome message (first interaction)
    const { count: assistantMsgCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("household_id", household_id)
      .eq("role", "assistant");

    if (assistantMsgCount === 0) {
      const currentUser = context.members.find((m) => m.id === user_id);
      const partnerNames = context.members
        .filter((m) => m.id !== user_id)
        .map((m) => m.display_name);
      const partnerStr = partnerNames.length
        ? ` and ${partnerNames.join(", ")}`
        : "";

      await supabase.from("messages").insert({
        household_id,
        user_id: null,
        role: "assistant",
        content: `Hey ${currentUser?.display_name ?? "there"}! I'm Indi, your household assistant. I can help you${partnerStr} manage tasks, set reminders, and keep track of everything.\n\nTry saying things like:\n- "Add 'buy groceries' to the shopping list"\n- "What tasks are due this week?"\n- "Remind me about the dentist tomorrow at 9am"\n- "What's on my plate today?"\n\nJust chat normally — I'm here whenever you need help!`,
        intent: "welcome",
      });
    }

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("*, profiles(display_name)")
      .eq("household_id", household_id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Build Claude conversation
    const systemPrompt = buildSystemPrompt(context);
    const conversationHistory = buildConversationHistory(
      (recentMessages ?? []).reverse(),
      context
    );

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const assistantText =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    // Parse and execute ACTION blocks
    const { cleanText, actions } = parseActions(assistantText);
    const actionResults = await executeActions(supabase, actions, context);

    // Build final response
    const finalText = cleanText || "I'm not sure how to help with that. Try asking me about your tasks!";

    // Insert assistant message
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({
        household_id,
        user_id: null,
        role: "assistant",
        content: finalText,
        intent: actions.length > 0 ? actions[0]!.type : "chat",
        related_task_id: actionResults.find((r) => r.taskId)?.taskId ?? null,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ message: assistantMsg, actions_executed: actionResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ---------------------------------------------------------------------------
// Context gathering
// ---------------------------------------------------------------------------

async function gatherContext(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
  userId: string
): Promise<HouseholdContext> {
  const [
    { data: household },
    { data: members },
    { data: lists },
    { data: recentActivity },
    { data: userPrefs },
  ] = await Promise.all([
    supabase.from("households").select("*").eq("id", householdId).single(),
    supabase.from("profiles").select("*").eq("household_id", householdId),
    supabase.from("lists").select("*").eq("household_id", householdId),
    supabase
      .from("activity_log")
      .select("*, profiles(display_name)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("assistant_preferences")
      .select("*")
      .eq("user_id", userId)
      .single(),
  ]);

  // Fetch tasks using the household's list IDs
  const listIds = (lists ?? []).map((l: { id: string }) => l.id);
  let tasks: HouseholdContext["tasks"] = [];

  if (listIds.length > 0) {
    const { data: taskData } = await supabase
      .from("tasks")
      .select("*, lists(name)")
      .in("list_id", listIds)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(50);
    tasks = taskData ?? [];
  }

  return {
    household: household ?? { id: householdId, name: "Household" },
    members: members ?? [],
    lists: lists ?? [],
    tasks,
    recentActivity: recentActivity ?? [],
    currentUserId: userId,
    agentTone: userPrefs?.agent_tone ?? "friendly",
  };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(context: HouseholdContext): string {
  const currentUser = context.members.find(
    (m) => m.id === context.currentUserId
  );
  const otherMembers = context.members.filter(
    (m) => m.id !== context.currentUserId
  );

  const memberList = context.members
    .map((m) => `${m.display_name} (id: ${m.id})`)
    .join(", ");

  const listSummary = context.lists
    .map((l) => `"${l.name}" (id: ${l.id})`)
    .join(", ");

  const pendingTasks = context.tasks
    .filter((t) => t.status !== "completed")
    .map((t) => {
      const assignee = context.members.find((m) => m.id === t.assigned_to);
      const assignedStr = t.shared_responsibility
        ? "shared"
        : assignee?.display_name ?? "unassigned";
      return `- "${t.title}" [${t.priority}/${t.urgency}] due: ${t.due_date ?? "none"} assigned: ${assignedStr} list: "${t.lists?.name}" (task_id: ${t.id}, list_id: ${t.list_id})`;
    })
    .join("\n");

  const completedRecently = context.tasks
    .filter((t) => t.status === "completed")
    .slice(0, 10)
    .map((t) => `- "${t.title}" (list: "${t.lists?.name}")`)
    .join("\n");

  const overdueTasks = context.tasks
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.due_date &&
        new Date(t.due_date) < new Date(new Date().toDateString())
    )
    .map((t) => {
      const assignee = context.members.find((m) => m.id === t.assigned_to);
      return `- "${t.title}" due: ${t.due_date} assigned: ${assignee?.display_name ?? "unassigned"}`;
    })
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  return `You are Indi, the AI household assistant for the "${context.household.name}" household on IndiVisible.

HOUSEHOLD MEMBERS: ${memberList}
CURRENT SPEAKER: ${currentUser?.display_name ?? "Unknown"} (id: ${context.currentUserId})
${otherMembers.length ? `PARTNER(S): ${otherMembers.map((m) => `${m.display_name} (id: ${m.id})`).join(", ")}` : "No partner has joined yet."}

AVAILABLE LISTS: ${listSummary || "No lists created yet."}

PENDING TASKS:
${pendingTasks || "No pending tasks."}

OVERDUE TASKS:
${overdueTasks || "None."}

RECENTLY COMPLETED:
${completedRecently || "None recently."}

TODAY'S DATE: ${today}

TONE: ${context.agentTone}

## Your Personality
- Warm, concise, and practical — like a thoughtful friend who's great at organizing
- Keep messages short — 1-3 sentences for quick answers, up to a paragraph for summaries
- Use emoji sparingly (one per message max, and only when natural)
- Never passive-aggressive or guilt-tripping
- Celebrate completions genuinely but briefly
- When referring to tasks a partner added, credit them by name

## Task Commands
When the user asks you to perform a task action, include an ACTION block in your response:

[ACTION:create_task]{"title":"...","list_id":"...","assigned_to":"user_id or null","priority":"none","urgency":"none","due_date":"YYYY-MM-DD or null","description":""}[/ACTION]

[ACTION:complete_task]{"task_id":"..."}[/ACTION]

[ACTION:update_task]{"task_id":"...","updates":{"title":"...","assigned_to":"...","due_date":"..."}}[/ACTION]

[ACTION:delete_task]{"task_id":"..."}[/ACTION]

[ACTION:create_reminder]{"task_id":"...","user_id":"...","remind_at":"ISO8601"}[/ACTION]

## Rules
- This is a 3-way chat — both partners see all messages. Be aware of that.
- Never show task IDs or internal IDs to users in your visible text.
- Only reference tasks that actually exist in the data above.
- If you're unsure which task the user means, ask for clarification.
- If asked to create a task but no list matches, suggest available lists.
- If no lists exist, tell the user to create a list first.
- If asked something outside household task management, be helpful but brief and redirect.
- Keep all responses under 200 words unless asked for a detailed summary.
- For recurring tasks, include the recurrence info in your response but don't set recurrence_rule via action (users can configure that in the app).`;
}

// ---------------------------------------------------------------------------
// Conversation history
// ---------------------------------------------------------------------------

function buildConversationHistory(
  messages: {
    role: string;
    content: string;
    user_id: string | null;
    profiles?: { display_name: string } | null;
  }[],
  context: HouseholdContext
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((msg) => {
    if (msg.role === "assistant") {
      return { role: "assistant" as const, content: msg.content };
    }

    // For user messages, prefix with the speaker's name so Claude knows who's talking
    const sender =
      context.members.find((m) => m.id === msg.user_id)?.display_name ??
      msg.profiles?.display_name ??
      "User";

    return {
      role: "user" as const,
      content: `[${sender}]: ${msg.content}`,
    };
  });
}

// ---------------------------------------------------------------------------
// Action parsing
// ---------------------------------------------------------------------------

function parseActions(text: string): {
  cleanText: string;
  actions: ParsedAction[];
} {
  const actionRegex = /\[ACTION:(\w+)\]([\s\S]*?)\[\/ACTION\]/g;
  const actions: ParsedAction[] = [];
  let cleanText = text;

  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      actions.push({
        type: match[1]!,
        payload: JSON.parse(match[2]!),
      });
      cleanText = cleanText.replace(match[0], "");
    } catch {
      console.error("Failed to parse action:", match[0]);
    }
  }

  return { cleanText: cleanText.trim(), actions };
}

// ---------------------------------------------------------------------------
// Action execution
// ---------------------------------------------------------------------------

async function executeActions(
  supabase: ReturnType<typeof createClient>,
  actions: ParsedAction[],
  context: HouseholdContext
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    switch (action.type) {
      case "create_task": {
        const {
          title,
          list_id,
          assigned_to,
          priority,
          urgency,
          due_date,
          due_time,
          description,
        } = action.payload as Record<string, string | null>;

        if (!title || !list_id) {
          results.push({
            type: "create_task",
            success: false,
            error: "Missing title or list_id",
          });
          break;
        }

        const { data, error } = await supabase
          .from("tasks")
          .insert({
            list_id,
            title,
            description: description ?? "",
            priority: priority ?? "none",
            urgency: urgency ?? "none",
            assigned_to: assigned_to ?? null,
            due_date: due_date ?? null,
            due_time: due_time ?? null,
            created_by: context.currentUserId,
            sort_order: 999,
          })
          .select()
          .single();

        if (data) {
          await supabase.from("activity_log").insert({
            household_id: context.household.id,
            task_id: data.id,
            list_id,
            user_id: context.currentUserId,
            action: "task_created",
            details: { title, via: "assistant" },
          });
          results.push({
            type: "create_task",
            success: true,
            taskId: data.id,
          });
        } else {
          results.push({
            type: "create_task",
            success: false,
            error: error?.message,
          });
        }
        break;
      }

      case "complete_task": {
        const { task_id } = action.payload as { task_id: string };
        const { error } = await supabase
          .from("tasks")
          .update({
            status: "completed",
            completed_by: context.currentUserId,
            completed_at: new Date().toISOString(),
          })
          .eq("id", task_id);

        if (!error) {
          await supabase.from("activity_log").insert({
            household_id: context.household.id,
            task_id,
            user_id: context.currentUserId,
            action: "task_completed",
            details: { via: "assistant" },
          });
        }
        results.push({
          type: "complete_task",
          success: !error,
          taskId: task_id,
          error: error?.message,
        });
        break;
      }

      case "update_task": {
        const { task_id, updates } = action.payload as {
          task_id: string;
          updates: Record<string, unknown>;
        };
        const { error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", task_id);

        if (!error) {
          await supabase.from("activity_log").insert({
            household_id: context.household.id,
            task_id,
            user_id: context.currentUserId,
            action: "task_updated",
            details: { ...updates, via: "assistant" },
          });
        }
        results.push({
          type: "update_task",
          success: !error,
          taskId: task_id,
          error: error?.message,
        });
        break;
      }

      case "delete_task": {
        const { task_id } = action.payload as { task_id: string };
        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", task_id);

        if (!error) {
          await supabase.from("activity_log").insert({
            household_id: context.household.id,
            task_id,
            user_id: context.currentUserId,
            action: "task_deleted",
            details: { via: "assistant" },
          });
        }
        results.push({
          type: "delete_task",
          success: !error,
          taskId: task_id,
          error: error?.message,
        });
        break;
      }

      case "create_reminder": {
        const { task_id, user_id, remind_at } = action.payload as {
          task_id: string;
          user_id: string;
          remind_at: string;
        };
        const { error } = await supabase.from("reminders").insert({
          task_id,
          user_id,
          remind_at,
          type: "in_app",
        });
        results.push({
          type: "create_reminder",
          success: !error,
          taskId: task_id,
          error: error?.message,
        });
        break;
      }
    }
  }

  return results;
}
