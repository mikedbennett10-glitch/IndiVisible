-- AI Assistant: Extend messages table + create assistant_preferences

-- ==========================================================================
-- 1. ALTER MESSAGES TABLE
-- ==========================================================================

-- Role column: distinguish user vs assistant messages
ALTER TABLE public.messages
  ADD COLUMN role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'assistant'));

-- Assistant messages have no real user
ALTER TABLE public.messages
  ALTER COLUMN user_id DROP NOT NULL;

-- Optional intent classification
ALTER TABLE public.messages
  ADD COLUMN intent text;

-- Link to a task the assistant acted on
ALTER TABLE public.messages
  ADD COLUMN related_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Track which users have read assistant messages
ALTER TABLE public.messages
  ADD COLUMN read_by uuid[] DEFAULT '{}';

-- Index for filtering assistant messages
CREATE INDEX idx_messages_role ON public.messages(household_id, role)
  WHERE role = 'assistant';

-- ==========================================================================
-- 2. ASSISTANT PREFERENCES TABLE
-- ==========================================================================

CREATE TABLE public.assistant_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00',
  briefing_time time DEFAULT '08:00',
  agent_frequency text NOT NULL DEFAULT 'normal'
    CHECK (agent_frequency IN ('off', 'minimal', 'normal', 'proactive')),
  agent_tone text NOT NULL DEFAULT 'friendly'
    CHECK (agent_tone IN ('professional', 'friendly', 'casual', 'brief')),
  snoozed_until timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_prefs_user ON public.assistant_preferences(user_id);

-- Reuse existing updated_at trigger function
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assistant_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.assistant_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assistant preferences"
  ON public.assistant_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assistant preferences"
  ON public.assistant_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assistant preferences"
  ON public.assistant_preferences FOR UPDATE
  USING (user_id = auth.uid());
