BEGIN;
CREATE TABLE IF NOT EXISTS hd_support_requests (
  id uuid PRIMARY KEY,
  owner_hash text NOT NULL,
  payload_hash text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','submitted','unconfirmed')),
  provider_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hd_support_owner ON hd_support_requests(owner_hash);
COMMIT;
