# Backups and recovery

Two recovery options are included: a full source/catalog archive and a separate dependency-free maintenance website. Neither is a duplicate ranking site. No extra domain has been bought or published.

## Create a source backup

From the application root on Linux, macOS or WSL with Node 22+ and tar:

```bash
npm run backup
```

This produces a dated tar.gz, a SHA-256 checksum file, and an internal manifest of per-file hashes under private-backups. Only approved source directories and root configuration files are copied. API keys, local environment files, merchant cost reports, node_modules, build output and order/customer databases are excluded. Symlinks are rejected.

This is a source and public-catalog backup, not a complete commerce-system backup. Store runtime secrets separately in a secret manager. The PostgreSQL payment/order database needs its own encrypted backup and tested restoration; the source archive does not contain orders or customer payment records.

## Restore a full instance

Keep the checksum next to the archive. Substitute the actual dated filenames and extract into a new empty directory:

```bash
sha256sum -c hustlerdior-source-TIMESTAMP.tar.gz.sha256
mkdir hustlerdior-restored
tar -xzf hustlerdior-source-TIMESTAMP.tar.gz -C hustlerdior-restored
cd hustlerdior-restored
cp .env.example .env.local
npm ci
npm run db:migrate
npm run build
npm start
```

On macOS, use `shasum -a 256 -c` for the checksum. Populate secrets through the deployment’s protected variables. For a test/backup domain, use the settings in recovery/.env.backup.example: SITE_ROLE=backup, SEARCH_INDEXING=false and CATALOG_SNAPSHOT_PREVIEW=true. Keep CHECKOUT_ENABLED=false and TRYON_ENABLED=false on a recovery/test instance. Restore order and queue state from the database backup separately before resuming payment webhooks or workers.

Use Hostinger access protection if available. The application also sends noindex headers and meta tags; these are search controls, not access control. Robots are allowed to read those pages so they can observe noindex. Canonical links continue pointing at hustlerdior.com. Test backup headers before making the recovery address reachable.

## Independent maintenance website

The recovery directory contains a branded HTML page and a tiny Node server. It needs no Printful token, React bundle, database, image CDN or external font.

```bash
npm run recovery
```

Or deploy only the recovery directory to an existing Hostinger Node application and run `node server.mjs`. Configure PORT through the hosting environment. Every request returns **503 Service Unavailable**, Retry-After: 3600 and X-Robots-Tag: noindex, nofollow, noarchive. It cannot accept a cart, payment or order.

For a temporary interruption on the main domain, use this page briefly while restoring the primary service. Do not leave a 503 maintenance page as a permanent replacement. Restore the full application, check checkout/inventory, and remove recovery routing once ready.

If the HTML is uploaded to static hosting by itself, configure equivalent 503 and noindex headers at the host; the HTML file alone cannot set HTTP status or response headers. The Node server is the tested route included here.

## Promotion and verification

Verify the restored instance privately first: product and variant pages, images, payment test mode, order idempotency, webhook signatures and database state. At promotion, point the existing primary domain at the reviewed instance and use the primary settings in SEO-AEO.md. Ensure only the primary domain is indexable. Keep a prior tested archive to roll back source changes.

The included local verification checks the archive’s hashes and credential exclusions and confirms that the maintenance server returns 503/noindex. Hostinger restoration and failover could not be exercised because account access was blocked in this session.
