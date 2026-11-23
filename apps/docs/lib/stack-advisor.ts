export type ArtifactSizeTier = 'small' | 'medium' | 'large' | 'huge';
export type HostingStyle = 'any' | 'serverless' | 'self-hosted';

export interface PlatformOption {
  id: string;
  name: string;
  href: string;
  style: 'serverless' | 'self-hosted';
  maxMb: number | null;
  limitLabel: string;
  expiry: string;
  stats: string;
  defaultTarget?: boolean;
}

export interface StorageOption {
  id: string;
  name: string;
  href: string;
  maxMb: number | null;
  limitLabel: string;
  summary: string;
  cloudflareOnly?: boolean;
}

export const SIZE_TIERS: readonly { id: ArtifactSizeTier; label: string; minMb: number }[] = [
  { id: 'small', label: '< 4.5 MB', minMb: 4 },
  { id: 'medium', label: '4.5 – 25 MB', minMb: 25 },
  { id: 'large', label: '25 – 100 MB', minMb: 100 },
  { id: 'huge', label: '> 100 MB', minMb: 250 },
];

export const HOSTING_STYLES: readonly { id: HostingStyle; label: string }[] = [
  { id: 'any', label: 'Any runtime' },
  { id: 'serverless', label: 'Serverless' },
  { id: 'self-hosted', label: 'Self-hosted / Docker' },
];

export const PLATFORMS: readonly PlatformOption[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers',
    href: '/deploy/cloudflare',
    style: 'serverless',
    maxMb: 100,
    limitLabel: '100 MB (200 MB Business)',
    expiry: 'Built-in cron',
    stats: 'D1 (auto)',
    defaultTarget: true,
  },
  {
    id: 'node',
    name: 'Node.js, Bun, and Deno',
    href: '/deploy/node',
    style: 'self-hosted',
    maxMb: null,
    limitLabel: 'No built-in cap',
    expiry: 'In-process cron',
    stats: 'SQLite (Node/Deno)',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    href: '/deploy/vercel',
    style: 'serverless',
    maxMb: 4.5,
    limitLabel: '4.5 MB cap',
    expiry: 'Vercel Cron',
    stats: 'Hosted DB needed',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    href: '/deploy/netlify',
    style: 'serverless',
    maxMb: 4.5,
    limitLabel: '~4.5 MB cap',
    expiry: 'External cron',
    stats: 'Hosted DB needed',
  },
  {
    id: 'aws-lambda',
    name: 'AWS Lambda',
    href: '/deploy/aws-lambda',
    style: 'serverless',
    maxMb: 4.5,
    limitLabel: '< 6 MB (Base64)',
    expiry: 'External cron',
    stats: 'Hosted DB needed',
  },
];

export const STORAGES: readonly StorageOption[] = [
  {
    id: 'r2',
    name: 'Cloudflare R2',
    href: '/storage/r2',
    maxMb: null,
    limitLabel: '$0 egress',
    summary: 'Native Worker binding, 10 GB free/month',
    cloudflareOnly: true,
  },
  {
    id: 's3',
    name: 'S3-compatible bucket',
    href: '/storage/s3',
    maxMb: null,
    limitLabel: 'All platforms',
    summary: 'AWS S3, R2 over S3 API, MinIO, Tigris',
  },
  {
    id: 'kv',
    name: 'Cloudflare KV',
    href: '/storage/kv',
    maxMb: 25,
    limitLabel: '25 MiB cap',
    summary: 'Eventually consistent (60s+ global)',
    cloudflareOnly: true,
  },
  {
    id: 'custom',
    name: 'Custom Files SDK adapter',
    href: '/storage/custom-adapter',
    maxMb: null,
    limitLabel: 'GCS / disk / custom',
    summary: 'Requires user metadata + lastModified',
  },
];

const tierMb = (tier: ArtifactSizeTier) => SIZE_TIERS.find((item) => item.id === tier)?.minMb ?? 4;

export const evaluatePlatform = (
  platform: PlatformOption,
  size: ArtifactSizeTier,
  style: HostingStyle,
): { fits: boolean; reason?: string; recommended: boolean } => {
  if (style !== 'any' && platform.style !== style) {
    return { fits: false, reason: `Filtered (${platform.style})`, recommended: false };
  }
  const requiredMb = tierMb(size);
  if (platform.maxMb !== null && requiredMb > platform.maxMb) {
    return {
      fits: false,
      reason: `Exceeds ${platform.limitLabel}`,
      recommended: false,
    };
  }
  const recommended =
    (size === 'huge' && platform.id === 'node') ||
    (style === 'self-hosted' && platform.id === 'node') ||
    (size !== 'huge' && style !== 'self-hosted' && platform.id === 'cloudflare');
  return { fits: true, recommended };
};

export const evaluateStorage = (
  storage: StorageOption,
  size: ArtifactSizeTier,
  style: HostingStyle,
): { fits: boolean; reason?: string; recommended: boolean } => {
  if (storage.cloudflareOnly && style === 'self-hosted') {
    return { fits: false, reason: 'Cloudflare Workers only', recommended: false };
  }
  const requiredMb = tierMb(size);
  if (storage.maxMb !== null && requiredMb > storage.maxMb) {
    return { fits: false, reason: `Exceeds ${storage.limitLabel}`, recommended: false };
  }
  const recommended =
    (style === 'self-hosted' || size === 'huge') && storage.id === 's3'
      ? true
      : style !== 'self-hosted' && size !== 'huge' && storage.id === 'r2';
  return { fits: true, recommended };
};
