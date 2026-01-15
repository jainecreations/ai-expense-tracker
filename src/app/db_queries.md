SQL queries

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  month text not null,
  amount numeric not null,
  created_at timestamptz default now(),
  constraint budgets_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);


create table if not exists category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  month text not null,       -- format YYYY-MM
  category text not null,
  amount numeric not null,
  created_at timestamptz default now()
);

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  amount numeric not null,
  category text,
  frequency text not null,          -- e.g. 'monthly', 'weekly'
  start_date date not null,
  next_date date,
  last_generated_at timestamptz,
  active boolean not null default true,
  skipped boolean not null default false,
  created_at timestamptz default now()
);

-- Add AI suggestion and source columns to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ai_category text;
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ai_confidence double precision;
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ai_applied boolean DEFAULT false;
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS source text; -- 'manual','sms','receipt','recurring','import'
