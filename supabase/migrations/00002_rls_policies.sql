-- Indivisible RLS Policies
-- Run this AFTER 00001_initial_schema.sql

-- Helper: get the current user's household_id
create or replace function public.get_my_household_id()
returns uuid as $$
  select household_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ==========================================
-- HOUSEHOLDS RLS
-- ==========================================
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

-- Allow reading households by invite_code (for joining)
create policy "Anyone can look up household by invite code"
  on public.households for select
  to authenticated
  using (true);

-- ==========================================
-- PROFILES RLS
-- ==========================================
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

-- ==========================================
-- LISTS RLS
-- ==========================================
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

-- ==========================================
-- TASKS RLS
-- ==========================================
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

-- ==========================================
-- REMINDERS RLS
-- ==========================================
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

-- ==========================================
-- ACTIVITY LOG RLS (append-only for members)
-- ==========================================
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
