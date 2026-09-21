# Hostinger connection

The official `hostinger-api-mcp` package is the deployment connector for this project. Version **1.59.0** was installed and successfully authenticated in this workspace on September 13, 2026, using Node.js 24.19.0. The hosting server advertised 64 tools. A successful website lookup confirmed `hustlerdior.com` in the account.

This is a local MCP client connection. Pasting its JSON into a chat does not register new tools in ChatGPT. The active connection used a local stdio client and the official Hostinger server; it did not change the browser's security configuration.

## Configuration

Use [hostinger-mcp.example.json](hostinger-mcp.example.json) in an MCP-compatible desktop client. Replace the token placeholder privately in that client's configuration or secret settings. The five server commands match the requested hosting, domains, DNS, billing, and Reach services. `--yes` prevents an interactive npm installation prompt, and the package version is pinned for reproducibility.

The Hostinger token belongs only in deployment tooling. It must not go in the storefront environment, browser code, source archive, or Git repository. The site's Printful token is a different credential and remains a server environment variable.

Hostinger also documents a hosted MCP endpoint at `https://mcp.hostinger.com` with OAuth for clients that support remote Streamable HTTP connections. That remote connection was not configured or tested here.

## Deployment procedure

1. List hosting websites and orders to resolve the target and verify an active hosting plan. Check the detected website type before uploading.
2. For an existing Website Builder site, prepare a separate temporary website on the same plan. Preserve the Builder project until a supported domain migration is ready.
3. List existing Node.js environment variable names. The replacement endpoint replaces the entire set; never copy masked values from the list response into a replacement.
4. Set server-only Printful credentials, the exact preview `SITE_URL`, `SITE_ROLE=preview`, and `SEARCH_INDEXING=false`. Enable payments and AI image generation only after their services are configured and verified.
5. Call `hosting_deployJsApplication` with the absolute source archive path. This tool uploads the archive and starts the remote build. The archive must exclude credentials, dependencies, build output, and private order data.
6. Inspect the build status and logs. A completed upload or accepted build request is not a verified deployment. Check HTTPS, catalog responses, product imagery, product options, cart behavior, and search directives on the deployed address.
7. Migrate the primary domain only after staging verification. Preserve email DNS records and retain the previous DNS configuration for rollback.

## Included services and remaining checks

Account reads found active **Unlimited Web Hosting** and **Agent Starter** subscriptions. The hosting order uses the internal plan name `hostinger_business_v5`. No subscriptions were purchased or renewed by this connection work.

The Reach profile lookup returned a provider error, `[Reach:9999] Request failed`. That result does not establish whether Reach is included or provisioned. Before using Reach, inspect its profile, feature availability, and remaining email/recipient/AI quotas. No campaigns were sent or enabled during connection setup.

Hostinger's AI and Website Builder features are product-specific. Builder and WordPress features do not automatically appear in the custom Next.js storefront. Use the existing Agent subscription for supported account tasks and reviewed content work; verify actual credit limits before enabling new metered features.

## Sources

- [Official Hostinger MCP source and configuration](https://github.com/hostinger/api-mcp-server)
- [Hostinger API reference](https://developers.hostinger.com/)
- [Deploy a Node.js web app on Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger Agent features](https://www.hostinger.com/support/hostinger-agents-features-and-overview/)
