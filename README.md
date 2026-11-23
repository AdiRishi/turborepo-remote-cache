<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/docs/public/brand/lockup-on-dark.svg">
  <img src="apps/docs/public/brand/lockup-on-light.svg" alt="Turborepo Remote Cache" width="360">
</picture>

<br>
<br>

[![CI](https://github.com/AdiRishi/turborepo-remote-cache/actions/workflows/ci.yml/badge.svg)](https://github.com/AdiRishi/turborepo-remote-cache/actions/workflows/ci.yml) [![Coverage Status](https://coveralls.io/repos/github/AdiRishi/turborepo-remote-cache/badge.svg)](https://coveralls.io/github/AdiRishi/turborepo-remote-cache) ![GitHub License](https://img.shields.io/github/license/AdiRishi/turborepo-remote-cache) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)

<a href="https://turborepo-remote-cache.dev" target="_blank">
  <img src="https://img.shields.io/badge/Visit-Developer%20Docs-%230572BE?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Visit Developer Docs">
</a>

</div>

<br>

![A laptop runs turbo run build and misses the cache on all three tasks. A CI runner then runs the same build, replays every task from the cache, and finishes in 1.2 seconds with FULL TURBO. Beside the terminals, the dashboard counts each upload and hit as it lands and adds the 3 minutes 53 seconds the CI run saved.](.github/assets/live-cache.gif)

A self-hosted [Turborepo remote cache](https://turborepo.dev/docs/core-concepts/remote-caching) server built on [Nitro](https://nitro.build) and [Files SDK](https://files-sdk.dev). Deploy to Cloudflare Workers and R2 in one click, or build for Node.js, Bun, Deno, Vercel, Netlify, or AWS Lambda with any S3-compatible bucket.

Read the [documentation](https://turborepo-remote-cache.dev) for platform guides, interactive setup tools, and the full API reference.

## Why self-host

- **Drop-in v8 API.** Implements the official Turborepo Remote Cache specification natively. Set `remoteCache.apiUrl` in `turbo.json` and export `TURBO_TOKEN`. No Vercel account or `turbo login` is required.
- **Zero egress on Cloudflare R2.** The Workers free plan covers 100,000 requests a day, and R2 includes 10 GB of storage a month with [no egress fees](https://www.cloudflare.com/learning/cloud/what-are-data-egress-fees/). Heavy CI downloads do not run up bandwidth bills.
- **Built-in analytics dashboard.** Every deployment serves a live dashboard at `/`. Track build time saved, local and remote hit rates, storage growth, and usage across teams, CI providers, and coding agents.
- **End-to-end artifact signing.** The server stores and returns `x-artifact-tag` headers untouched so `turbo` verifies HMAC-SHA256 signatures locally. Your signing key never leaves your machines.
- **Portable runtime and storage.** Build the same codebase for [Cloudflare Workers, Node.js, Bun, Deno, Vercel, Netlify, or AWS Lambda](https://turborepo-remote-cache.dev/deploy), backed by [R2](https://turborepo-remote-cache.dev/storage/r2), [Workers KV](https://turborepo-remote-cache.dev/storage/kv), any [S3-compatible bucket](https://turborepo-remote-cache.dev/storage/s3), or a [custom Files SDK adapter](https://turborepo-remote-cache.dev/storage/custom-adapter).

## Quickstart

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/AdiRishi/turborepo-remote-cache)

If you have not used R2 on your Cloudflare account yet, open **R2 Object Storage** in the Cloudflare dashboard and activate it first.

The button forks this repository to your GitHub or GitLab account and provisions a Worker, an R2 bucket, and a D1 stats database automatically. When deployment finishes, add a Worker secret named `TURBO_TOKEN` with a 32-byte random value such as the output of `openssl rand -hex 32`.

### Deploy with the Wrangler CLI

Requires Node.js 24 or later and pnpm. [Wrangler](https://developers.cloudflare.com/workers/wrangler/) ships with the repository and provisions the R2 bucket and D1 database on the first deploy.

```sh
# 1. Clone the repository
git clone https://github.com/AdiRishi/turborepo-remote-cache.git
cd turborepo-remote-cache

# 2. Install packages
pnpm install

# 3. Build and deploy the Worker
pnpm build
pnpm run deploy

# 4. Set the bearer token
cd apps/api && pnpm exec wrangler secret put TURBO_TOKEN
```

If `TURBO_TOKEN` is already exported in your shell, remove `remoteCache` from this repository's root `turbo.json` before running `pnpm build`. See the [Cloudflare Workers guide](https://turborepo-remote-cache.dev/deploy/cloudflare) for full CLI and GitHub Actions steps.

## Connect Turborepo

Add your Worker's bare HTTPS origin (no trailing slash, no `/v8`) and a team slug to your repository's root `turbo.json`:

```json
{
    "remoteCache": {
        "apiUrl": "https://<your-worker>.workers.dev",
        "teamSlug": "my-team"
    }
}
```

Export `TURBO_TOKEN` on developer machines and in CI:

```sh
export TURBO_TOKEN='<your-token>'
```

`turbo` only uploads artifacts for tasks it executes. Local cache hits stay local. Clear `.turbo/cache` and run a build to populate the remote cache:

```sh
rm -rf .turbo/cache
npm exec -- turbo run build
```

Run those same two lines a second time. Clearing `.turbo/cache` simulates a fresh machine, so every hit replays from your server:

```text
• Remote caching enabled

build: cache hit, replaying logs edf677b2880f0799

 Tasks:    1 successful, 1 total
Cached:    1 cached, 1 total
  Time:    19ms >>> FULL TURBO
```

## Next steps

- Follow the [Quickstart](https://turborepo-remote-cache.dev/get-started) for a step-by-step walkthrough.
- Use [Connect Turborepo](https://turborepo-remote-cache.dev/connect-turbo) to generate `turbo.json`, local shell, and CI configs interactively and test your live deployment from the browser.
- Enable [Artifact signing](https://turborepo-remote-cache.dev/sign-artifacts) so `turbo` rejects unsigned or tampered artifacts on shared caches.
- Compare runtimes and artifact size caps with the interactive advisor on [Platforms](https://turborepo-remote-cache.dev/deploy).
- Pull new releases into your fork with [Updating your deployment](https://turborepo-remote-cache.dev/update).

## Contributing

Read [CONTRIBUTING.md](.github/CONTRIBUTING.md) to get started. Turborepo Remote Cache is an independent, MIT-licensed project. It is not affiliated with Vercel or Cloudflare.
