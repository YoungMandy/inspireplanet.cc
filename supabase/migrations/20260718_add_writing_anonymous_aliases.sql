create table if not exists public.writing_anonymous_aliases (
  user_id bigint primary key references public.users(id) on delete cascade,
  alias varchar(40) not null unique,
  created_at timestamptz not null default now()
);

alter table public.writing_comments
  add column if not exists anonymous_alias varchar(40);

comment on table public.writing_anonymous_aliases is
  'Stable, unique anonymous writing-circle alias assigned to each user.';

comment on column public.writing_comments.anonymous_alias is
  'Snapshot of the stable anonymous alias used when the comment was created.';

create index if not exists idx_writing_comments_anonymous_alias
  on public.writing_comments(anonymous_alias)
  where anonymous_alias is not null;
