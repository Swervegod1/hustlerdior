-- Private merchant staging only. These rows are not a public saleable catalog.
create table public.hd_supplier_inventory (
  product_id text primary key,
  name text not null,
  source_url text not null check (source_url like 'https://%'),
  payload jsonb not null,
  target_domains text[] not null,
  publication_status text not null default 'held' check (publication_status = 'held'),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now(),
  check (coalesce(jsonb_typeof(payload->'observation'->'variants') = 'array', false)),
  check (coalesce(payload->>'id' = product_id, false)),
  check (payload @> '{"merchant":{"status":"draft","saleEnabled":false,"pricing":{"markupBasisPoints":700}}}'::jsonb)
);
alter table public.hd_supplier_inventory enable row level security;
revoke all on public.hd_supplier_inventory from public, anon, authenticated;
grant select, insert, update on public.hd_supplier_inventory to service_role;
comment on table public.hd_supplier_inventory is 'Owner-approved supplier inventory drafts. Not consumed by public checkout; payment and fulfillment activation remain separate.';
