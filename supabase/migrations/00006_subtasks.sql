-- Subtasks / checklist items within tasks
create table public.subtasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_subtasks_task on public.subtasks(task_id, sort_order);

-- RLS: access via task -> list -> household chain
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

-- Enable realtime
alter publication supabase_realtime add table public.subtasks;
