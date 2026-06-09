alter table if exists public.profile
add column if not exists profile_picture_url text;
