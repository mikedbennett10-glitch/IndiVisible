-- Household chat messages
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_household on public.messages(household_id, created_at desc);

-- RLS
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

-- Enable realtime
alter publication supabase_realtime add table public.messages;
