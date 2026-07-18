alter table public.writing_posts
  add column if not exists is_anonymous boolean not null default false;

comment on column public.writing_posts.is_anonymous is
  'When true, public API responses must hide the author identity.';
