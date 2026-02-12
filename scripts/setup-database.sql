-- ==========================================================================
-- IndiVisible — Complete Database Setup
-- ==========================================================================
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- This creates all tables, indexes, RLS policies, and triggers needed.
-- ==========================================================================


-- ==========================================================================
-- 1. EXTENSIONS
-- ==========================================================================
create extension if not exists "uuid-ossp";


-- ==========================================================================
-- 2. ENUMS
-- ==========================================================================
create type task_priority as enum ('none', 'low', 'medium', 'high', 'critical');
create type task_urgency as enum ('none', 'low', 'medium', 'high', 'urgent');
create type task_status as enum ('pending', 'in_progress', 'completed');
create type reminder_type as enum ('push', 'email', 'in_app');
create type activity_action as enum (
  'task_created', 'task_updated', 'task_completed', 'task_uncompleted',
  'task_deleted', 'task_assigned', 'task_unassigned',
  'list_created', 'list_updated', 'list_deleted',
  'member_joined', 'member_left'
);


-- ==========================================================================
-- 3. TABLES
-- ==========================================================================

-- Households
create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_color text not null default '#a67434',
  household_id uuid references public.households(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lists
create table public.lists (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  icon text not null default 'list',
  color text not null default '#a67434',
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null,
  description text default '',
  priority task_priority not null default 'none',
  urgency task_urgency not null default 'none',
  status task_status not null default 'pending',
  due_date date,
  due_time time,
  assigned_to uuid references public.profiles(id) on delete set null,
  shared_responsibility boolean not null default false,
  recurrence_rule text,
  sort_order integer not null default 0,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  location_radius_m integer,
  created_by uuid not null references public.profiles(id),
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subtasks
create table public.subtasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Reminders
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  remind_at timestamptz not null,
  type reminder_type not null default 'in_app',
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  task_id uuid references public.tasks(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- Messages (household chat — shared between partners + AI assistant)
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  role text not null default 'user' check (role in ('user', 'assistant')),
  intent text,
  related_task_id uuid references public.tasks(id) on delete set null,
  read_by uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- Assistant preferences (per-user settings for Indi)
create table public.assistant_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  enabled boolean not null default true,
  quiet_hours_start time default '22:00',
  quiet_hours_end time default '07:00',
  briefing_time time default '08:00',
  agent_frequency text not null default 'normal'
    check (agent_frequency in ('off', 'minimal', 'normal', 'proactive')),
  agent_tone text not null default 'friendly'
    check (agent_tone in ('professional', 'friendly', 'casual', 'brief')),
  snoozed_until timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activity log
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  list_id uuid references public.lists(id) on delete set null,
  user_id uuid not null references public.profiles(id),
  action activity_action not null,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);


-- ==========================================================================
-- 4. INDEXES
-- ==========================================================================
create index idx_profiles_household on public.profiles(household_id);
create index idx_lists_household on public.lists(household_id);
create index idx_lists_sort on public.lists(household_id, sort_order);
create index idx_tasks_list on public.tasks(list_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_sort on public.tasks(list_id, sort_order);
create index idx_subtasks_task on public.subtasks(task_id, sort_order);
create index idx_reminders_task on public.reminders(task_id);
create index idx_reminders_user on public.reminders(user_id);
create index idx_reminders_pending on public.reminders(remind_at) where not sent;
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read) where not read;
create index idx_notifications_created on public.notifications(user_id, created_at desc);
create index idx_push_subscriptions_user on public.push_subscriptions(user_id);
create index idx_messages_household on public.messages(household_id, created_at desc);
create index idx_messages_role on public.messages(household_id, role) where role = 'assistant';
create index idx_assistant_prefs_user on public.assistant_preferences(user_id);
create index idx_activity_household on public.activity_log(household_id);
create index idx_activity_task on public.activity_log(task_id);
create index idx_activity_created on public.activity_log(created_at);


-- ==========================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ==========================================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.lists
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.assistant_preferences
  for each row execute function public.handle_updated_at();

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ==========================================================================
-- 6. RLS HELPER
-- ==========================================================================
create or replace function public.get_my_household_id()
returns uuid as $$
  select household_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;


-- ==========================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ==========================================================================

-- Households
alter table public.households enable row level security;

create policy "Users can view their own household"
  on public.households for select
  using (id = public.get_my_household_id());

create policy "Authenticated users can create households"
  on public.households for insert
  to authenticated
  with check (true);

create policy "Members can update their household"
  on public.households for update
  using (id = public.get_my_household_id());

create policy "Anyone can look up household by invite code"
  on public.households for select
  to authenticated
  using (true);

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view profiles in their household"
  on public.profiles for select
  using (
    household_id = public.get_my_household_id()
    or id = auth.uid()
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Lists
alter table public.lists enable row level security;

create policy "Household members can view lists"
  on public.lists for select
  using (household_id = public.get_my_household_id());

create policy "Household members can create lists"
  on public.lists for insert
  with check (household_id = public.get_my_household_id());

create policy "Household members can update lists"
  on public.lists for update
  using (household_id = public.get_my_household_id());

create policy "Household members can delete lists"
  on public.lists for delete
  using (household_id = public.get_my_household_id());

-- Tasks
alter table public.tasks enable row level security;

create policy "Household members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = tasks.list_id
      and l.household_id = public.get_my_household_id()
    )
  );

create policy "Household members can create tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.lists l
      where l.id = tasks.list_id
      and l.household_id = public.get_my_household_id()
    )
  );

create policy "Household members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.lists l
      where l.id = tasks.list_id
      and l.household_id = public.get_my_household_id()
    )
  );

create policy "Household members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.lists l
      where l.id = tasks.list_id
      and l.household_id = public.get_my_household_id()
    )
  );

-- Subtasks
alter table public.subtasks enable row level security;

create policy "Users can view subtasks in their household"
  on public.subtasks for select
  using (
    exists (
      select 1 from public.tasks t
      join public.lists l on l.id = t.list_id
      where t.id = subtasks.task_id
      and l.household_id = get_my_household_id()
    )
  );

create policy "Users can insert subtasks in their household"
  on public.subtasks for insert
  with check (
    exists (
      select 1 from public.tasks t
      join public.lists l on l.id = t.list_id
      where t.id = subtasks.task_id
      and l.household_id = get_my_household_id()
    )
  );

create policy "Users can update subtasks in their household"
  on public.subtasks for update
  using (
    exists (
      select 1 from public.tasks t
      join public.lists l on l.id = t.list_id
      where t.id = subtasks.task_id
      and l.household_id = get_my_household_id()
    )
  );

create policy "Users can delete subtasks in their household"
  on public.subtasks for delete
  using (
    exists (
      select 1 from public.tasks t
      join public.lists l on l.id = t.list_id
      where t.id = subtasks.task_id
      and l.household_id = get_my_household_id()
    )
  );

-- Reminders
alter table public.reminders enable row level security;

create policy "Users can view their reminders"
  on public.reminders for select
  using (user_id = auth.uid());

create policy "Users can create their reminders"
  on public.reminders for insert
  with check (user_id = auth.uid());

create policy "Users can update their reminders"
  on public.reminders for update
  using (user_id = auth.uid());

create policy "Users can delete their reminders"
  on public.reminders for delete
  using (user_id = auth.uid());

-- Notifications
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Push subscriptions
alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- Messages
alter table public.messages enable row level security;

create policy "Users can view messages in their household"
  on public.messages for select
  using (household_id = get_my_household_id());

create policy "Users can send messages in their household"
  on public.messages for insert
  with check (household_id = get_my_household_id() and user_id = auth.uid());

create policy "Users can delete own messages"
  on public.messages for delete
  using (user_id = auth.uid());

-- Assistant preferences
alter table public.assistant_preferences enable row level security;

create policy "Users can view own assistant preferences"
  on public.assistant_preferences for select
  using (user_id = auth.uid());

create policy "Users can insert own assistant preferences"
  on public.assistant_preferences for insert
  with check (user_id = auth.uid());

create policy "Users can update own assistant preferences"
  on public.assistant_preferences for update
  using (user_id = auth.uid());

-- Activity log
alter table public.activity_log enable row level security;

create policy "Household members can view activity"
  on public.activity_log for select
  using (household_id = public.get_my_household_id());

create policy "Household members can log activity"
  on public.activity_log for insert
  with check (
    household_id = public.get_my_household_id()
    and user_id = auth.uid()
  );


-- ==========================================================================
-- 8. REALTIME
-- ==========================================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.activity_log;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.subtasks;
