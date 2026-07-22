create table public.discover_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  size_id text not null check (size_id in ('16x16', '29x29', '58x58', '87x87')),
  rows integer not null check (rows > 0),
  cols integer not null check (cols > 0),
  snapshot jsonb not null,
  published_at timestamptz not null default now()
);

create index discover_projects_feed_idx
  on public.discover_projects (published_at desc, id desc);

alter table public.discover_projects enable row level security;
