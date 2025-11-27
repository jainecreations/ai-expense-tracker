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
