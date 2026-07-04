-- Run this in Supabase SQL Editor

create table if not exists users (
  id text primary key,
  email text,
  name text,
  role text,
  phone text,
  password_hash text,
  trust_score double precision default 0,
  identity_verified boolean default false,
  gov_verified boolean default false,
  aadhaar_masked text,
  fssai_number text,
  fssai_status text,
  gstin text,
  gstin_status text,
  created_at text
);

create table if not exists listings (
  id text primary key,
  seller_id text,
  seller_name text,
  seller_verified boolean default false,
  gov_verified boolean default false,
  trust_score double precision default 0,
  created_at text,
  whatsapp text,
  upi_id text,
  title text,
  title_hi text,
  description text,
  description_hi text,
  category text,
  price double precision,
  unit text,
  pincode text,
  stock integer default 0,
  images jsonb default '[]'::jsonb
);

create table if not exists activity_log (
  id text primary key,
  actor_id text,
  action text,
  target text,
  meta jsonb default '{}'::jsonb,
  created_at text
);

create table if not exists otp_store (
  id text primary key,
  user_id text,
  purpose text,
  aadhaar text,
  otp text,
  created_at text
);

create table if not exists login_attempts (
  id text primary key,
  identifier text,
  count integer default 0,
  last_at text
);

create table if not exists mirror_events (
  id text primary key,
  collection text,
  event text,
  payload jsonb default '{}'::jsonb,
  created_at text
);
