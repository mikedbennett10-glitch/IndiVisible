-- Indivisible Phase 1 Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================
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

-- ==========================================
-- HOUSEHOLDS
-- ==========================================
create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- ==========================================
-- PROFILES (extends auth.users)
-- ==========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_color text not null default '#a67434',
  household_id uuid references public.households(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- LISTS
-- ==========================================
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

-- ==========================================
-- TASKS
-- ==========================================
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
  -- Location fields (Phase 5 placeholders)
  location_name text,
  location_lat double precision,
  location_lng double precision,
  location_radius_m integer,
  -- Tracking
  created_by uuid not null references public.profiles(id),
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- REMINDERS
-- ==========================================
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  remind_at timestamptz not null,
  type reminder_type not null default 'in_app',
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==========================================
-- ACTIVITY LOG
-- ==========================================
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

-- ==========================================
-- INDEXES
-- ==========================================
create index idx_profiles_household on public.profiles(household_id);
create index idx_lists_household on public.lists(household_id);
create index idx_lists_sort on public.lists(household_id, sort_order);
create index idx_tasks_list on public.tasks(list_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_sort on public.tasks(list_id, sort_order);
create index idx_reminders_task on public.reminders(task_id);
create index idx_reminders_user on public.reminders(user_id);
create index idx_reminders_pending on public.reminders(remind_at) where not sent;
create index idx_activity_household on public.activity_log(household_id);
create index idx_activity_task on public.activity_log(task_id);
create index idx_activity_created on public.activity_log(created_at);

-- ==========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==========================================
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

-- ==========================================
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ==========================================
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

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.activity_log;
