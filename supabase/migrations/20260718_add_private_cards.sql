alter table public.cards
  add column if not exists is_private boolean not null default false;

comment on column public.cards.is_private is
  'Private cards are returned only to their author.';

create index if not exists idx_cards_visibility_created
  on public.cards(is_private, created desc);
