BEGIN;
CREATE TABLE IF NOT EXISTS hd_orders (
  id uuid PRIMARY KEY,
  owner_hash text NOT NULL,
  snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted','checkout','paid','draft_created','manual_review','expired','payment_failed')),
  stripe_session_id text UNIQUE,
  stripe_payment_id text UNIQUE,
  printful_order_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hd_orders_owner ON hd_orders(owner_hash);
CREATE TABLE IF NOT EXISTS hd_payment_jobs (
  event_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES hd_orders(id),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token uuid,
  done boolean NOT NULL DEFAULT false,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hd_payment_jobs_pending ON hd_payment_jobs(available_at) WHERE done=false;
CREATE TABLE IF NOT EXISTS hd_usage (
  bucket text NOT NULL,
  window_id text NOT NULL,
  used integer NOT NULL CHECK (used >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(bucket, window_id)
);
COMMIT;
