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

**Host your own [Turborepo remote cache](https://turborepo.dev/docs/core-concepts/remote-caching) in minutes, with zero egress fees and a live dashboard included.**

Deploy to Cloudflare Workers and R2 in one click, or run the same server on Node.js, Bun, Deno, Vercel, Netlify, or AWS Lambda with any S3-compatible bucket. Share build outputs across laptops, CI, and coding agents without a Vercel account or bandwidth bills.

Full platform guides, interactive setup tools, and the API reference live in the [docs](https://turborepo-remote-cache.dev).

## Why self-host

- **Built for Cloudflare's free tier.** Workers includes 100,000 requests a day, and R2 includes 10 GB of storage a month with [zero egress fees](https://www.cloudflare.com/learning/cloud/what-are-data-egress-fees/). Heavy CI downloads cost nothing in bandwidth.
- **Drop-in Remote Cache v8 API.** Point `turbo.json` at your server and set `TURBO_TOKEN`. No Vercel account, no plugin, and no `turbo login`.
- **A live dashboard at `/`.** Track build time saved, local and remote hit rates, storage growth, and usage across teams, CI providers, and coding agents out of the box.
- **End-to-end artifact signing.** Stores `x-artifact-tag` headers untouched so `turbo` verifies HMAC-SHA256 signatures locally. Your signing key never leaves your machines.
- **Run it anywhere.** Built on [Nitro](https://nitro.build) and [Files SDK](https://files-sdk.dev). Deploy to [Cloudflare Workers, Node.js, Bun, Deno, Vercel, Netlify, or AWS Lambda](https://turborepo-remote-cache.dev/deploy) with [R2](https://turborepo-remote-cache.dev/storage/r2), [Workers KV](https://turborepo-remote-cache.dev/storage/kv), any [S3-compatible bucket](https://turborepo-remote-cache.dev/storage/s3), or a [custom adapter](https://turborepo-remote-cache.dev/storage/custom-adapter).

## Quickstart

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/AdiRishi/turborepo-remote-cache)

Make sure R2 is enabled on your Cloudflare account, click deploy, then add a Worker secret named `TURBO_TOKEN` (generate one with `openssl rand -hex 32`).

### Or deploy with the CLI

```sh
git clone https://github.com/AdiRishi/turborepo-remote-cache.git
cd turborepo-remote-cache
pnpm install && pnpm build && pnpm run deploy
cd apps/api && pnpm exec wrangler secret put TURBO_TOKEN
```

Needs Node.js 24+ and pnpm. See the [Cloudflare Workers guide](https://turborepo-remote-cache.dev/deploy/cloudflare) for full CLI and GitHub Actions details.

## Point turbo at your cache

Add `remoteCache` to your repository's root `turbo.json`:

```json
{
    "remoteCache": {
        "apiUrl": "https://<your-worker>.workers.dev",
        "teamSlug": "my-team"
    }
}
```

Export your token locally and in CI:

```sh
export TURBO_TOKEN='<your-token>'
```

Clear `.turbo/cache` and run a build twice (the first uploads, the second replays from your server):

```sh
rm -rf .turbo/cache && npm exec -- turbo run build
```

```text
• Remote caching enabled

build: cache hit, replaying logs edf677b2880f0799

 Tasks:    1 successful, 1 total
Cached:    1 cached, 1 total
  Time:    19ms >>> FULL TURBO
```

That's all it takes. From here, grab ready-to-paste repo and CI configs on [Connect Turborepo](https://turborepo-remote-cache.dev/connect-turbo), lock down shared caches with [Artifact signing](https://turborepo-remote-cache.dev/sign-artifacts), compare hosts on [Platforms](https://turborepo-remote-cache.dev/deploy), or pull new releases with [Updating your deployment](https://turborepo-remote-cache.dev/update).

## Contributing

Read [CONTRIBUTING.md](.github/CONTRIBUTING.md) to get started. Turborepo Remote Cache is an independent, MIT-licensed project. It is not affiliated with Vercel or Cloudflare.

---

<div align="center">

Made with ❤️

</div>
