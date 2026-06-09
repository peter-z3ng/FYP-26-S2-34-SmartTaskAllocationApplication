alter table if exists public.user_account
  add column if not exists subscription_tier varchar not null default 'Free';

update public.user_account
set subscription_tier = 'Free'
where subscription_tier is null;
