import { useState } from 'react';

import type {
  ArtifactSizeTier,
  HostingStyle,
  PlatformOption,
  StorageOption,
} from '../lib/stack-advisor';

import {
  evaluatePlatform,
  evaluateStorage,
  HOSTING_STYLES,
  PLATFORMS,
  SIZE_TIERS,
  STORAGES,
} from '../lib/stack-advisor';

export const client = 'visible';

const pillClass = (active: boolean) =>
  `cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-border bg-background text-muted-foreground hover:text-foreground'
  }`;

const cardClass = (recommended: boolean, fits: boolean) => {
  if (recommended) {
    return 'border-accent bg-background hover:bg-muted/60';
  }
  return fits
    ? 'border-border bg-background hover:border-accent/60'
    : 'border-border/60 bg-muted/40 opacity-55 hover:opacity-80';
};

interface FilterGroupProps<TId extends string> {
  label: string;
  ariaLabel: string;
  options: readonly { id: TId; label: string }[];
  selected: TId;
  onSelect: (id: TId) => void;
}

function FilterGroup<TId extends string>({
  label,
  ariaLabel,
  options,
  selected,
  onSelect,
}: FilterGroupProps<TId>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={ariaLabel}>
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            onSelect(option.id);
          }}
          className={pillClass(selected === option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function VerdictBadge({
  recommended,
  reason,
  fallback,
}: {
  recommended: boolean;
  reason?: string;
  fallback: string;
}) {
  if (recommended) {
    return (
      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
        Recommended
      </span>
    );
  }
  if (reason) {
    return (
      <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-600 dark:text-red-400">
        {reason}
      </span>
    );
  }
  return <span className="font-mono text-[11px] text-muted-foreground">{fallback}</span>;
}

function PlatformCard({
  platform,
  size,
  style,
}: {
  platform: PlatformOption;
  size: ArtifactSizeTier;
  style: HostingStyle;
}) {
  const verdict = evaluatePlatform(platform, size, style);
  return (
    <a
      href={platform.href}
      className={`block rounded-md border p-3 no-underline transition-colors ${cardClass(verdict.recommended, verdict.fits)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{platform.name}</span>
        <VerdictBadge
          recommended={verdict.recommended}
          reason={verdict.reason}
          fallback={platform.limitLabel}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {platform.limitLabel} · {platform.expiry} · {platform.stats}
      </p>
    </a>
  );
}

function StorageCard({
  storage,
  size,
  style,
}: {
  storage: StorageOption;
  size: ArtifactSizeTier;
  style: HostingStyle;
}) {
  const verdict = evaluateStorage(storage, size, style);
  return (
    <a
      href={storage.href}
      className={`block rounded-md border p-3 no-underline transition-colors ${cardClass(verdict.recommended, verdict.fits)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{storage.name}</span>
        <VerdictBadge
          recommended={verdict.recommended}
          reason={verdict.reason}
          fallback={storage.limitLabel}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{storage.summary}</p>
    </a>
  );
}

function AdvisorResults({ size, style }: { size: ArtifactSizeTier; style: HostingStyle }) {
  return (
    <div className="grid gap-5 p-4 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Platforms
        </p>
        <div className="space-y-2">
          {PLATFORMS.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} size={size} style={style} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Storage backends
        </p>
        <div className="space-y-2">
          {STORAGES.map((storage) => (
            <StorageCard key={storage.id} storage={storage} size={size} style={style} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StackAdvisor() {
  const [size, setSize] = useState<ArtifactSizeTier>('medium');
  const [style, setStyle] = useState<HostingStyle>('any');

  return (
    <div className="not-prose my-6 overflow-hidden rounded-blume border border-border bg-muted/40">
      <div className="space-y-3 border-b border-border bg-muted/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">Platform & storage advisor</span>
          <span className="text-xs text-muted-foreground">
            Filter by your largest build artifact
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
          <FilterGroup
            label="Largest artifact:"
            ariaLabel="Max artifact size"
            options={SIZE_TIERS}
            selected={size}
            onSelect={setSize}
          />
          <FilterGroup
            label="Hosting:"
            ariaLabel="Hosting style"
            options={HOSTING_STYLES}
            selected={style}
            onSelect={setStyle}
          />
        </div>
      </div>
      <AdvisorResults size={size} style={style} />
    </div>
  );
}
