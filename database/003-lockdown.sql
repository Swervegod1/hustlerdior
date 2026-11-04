-- Server-only commerce tables. The application connects as a privileged PostgreSQL role;
-- browser/anon/authenticated Data API roles must never access payment or address data.
BEGIN;
ALTER TABLE public.hd_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hd_payment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hd_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hd_support_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE
  public.hd_orders,
  public.hd_payment_jobs,
  public.hd_usage,
  public.hd_support_requests
FROM PUBLIC, anon, authenticated;
COMMIT;
