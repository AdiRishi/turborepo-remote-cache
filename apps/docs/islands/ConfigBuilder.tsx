import { useState } from 'react';

import type { CiProvider, ConfigBuilderInput, OutputTab } from '../lib/config-builder';

import {
  buildOutput,
  CI_PROVIDERS,
  OUTPUT_TABS,
  outputFilename,
  randomHex32,
} from '../lib/config-builder';

export const client = 'visible';

const pillClass = (active: boolean) =>
  `cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-border bg-background text-muted-foreground hover:text-foreground'
  }`;

interface SecretActionsProps {
  hasSecrets: boolean;
  signing: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

interface TextInputsProps {
  apiUrl: string;
  teamSlug: string;
  onApiUrl: (value: string) => void;
  onTeamSlug: (value: string) => void;
}

interface OptionRowProps {
  signing: boolean;
  ci: CiProvider;
  onSigning: (value: boolean) => void;
  onCi: (value: CiProvider) => void;
}

interface OutputPaneProps {
  tab: OutputTab;
  filename: string;
  code: string;
  copied: boolean;
  onTab: (value: OutputTab) => void;
  onCopy: () => void;
}

function SecretActions({ hasSecrets, signing, onGenerate, onClear }: SecretActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onGenerate}
        className="cursor-pointer rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
      >
        {signing ? 'Generate token & signing key' : 'Generate TURBO_TOKEN'}
      </button>
      {hasSecrets ? (
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-xs text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground"
        >
          Reset to placeholders
        </button>
      ) : null}
    </div>
  );
}

function TextInputs({ apiUrl, teamSlug, onApiUrl, onTeamSlug }: TextInputsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Server origin</span>
        <input
          type="url"
          value={apiUrl}
          onChange={(event) => {
            onApiUrl(event.target.value);
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Team slug</span>
        <input
          type="text"
          value={teamSlug}
          onChange={(event) => {
            onTeamSlug(event.target.value);
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
        />
      </label>
    </div>
  );
}

function OptionRow({ signing, ci, onSigning, onCi }: OptionRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
        <input
          type="checkbox"
          checked={signing}
          onChange={(event) => {
            onSigning(event.target.checked);
          }}
          className="size-3.5 accent-[var(--blume-accent)]"
        />
        Enable HMAC-SHA256 artifact signing
      </label>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="CI provider">
        {CI_PROVIDERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              onCi(option.id);
            }}
            className={pillClass(ci === option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutputTabs({ tab, onTab }: { tab: OutputTab; onTab: (value: OutputTab) => void }) {
  return (
    <div
      className="flex min-w-0 items-center gap-1 overflow-x-auto"
      role="tablist"
      aria-label="Generated config"
    >
      {OUTPUT_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => {
            onTab(item.id);
          }}
          className={`shrink-0 cursor-pointer rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
            tab === item.id
              ? 'bg-background text-foreground shadow-xs ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function OutputPane({ tab, filename, code, copied, onTab, onCopy }: OutputPaneProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-code">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-1.5">
        <OutputTabs tab={tab} onTab={onTab} />
        <div className="flex shrink-0 items-center gap-2 pr-1">
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            {filename}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="cursor-pointer rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div
        role="region"
        aria-label={filename}
        className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-foreground"
      >
        <code className="block whitespace-pre">{code}</code>
      </div>
    </div>
  );
}

function useCopyText() {
  const [copied, setCopied] = useState(false);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };
  return { copied, copy };
}

function BuilderHeader({ hasSecrets, signing, onGenerate, onClear }: SecretActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
      <span className="text-sm font-semibold text-foreground">Interactive setup generator</span>
      <SecretActions
        hasSecrets={hasSecrets}
        signing={signing}
        onGenerate={onGenerate}
        onClear={onClear}
      />
    </div>
  );
}

const EMPTY_SECRETS = { token: '', signingKey: '' };

function useBuilderState() {
  const [apiUrl, setApiUrl] = useState('https://turborepo-remote-cache.acme.workers.dev');
  const [teamSlug, setTeamSlug] = useState('my-team');
  const [signing, setSigning] = useState(false);
  const [ci, setCi] = useState<CiProvider>('github');
  const [secrets, setSecrets] = useState(EMPTY_SECRETS);
  const [tab, setTab] = useState<OutputTab>('turbo');
  const input: ConfigBuilderInput = { apiUrl, teamSlug, signing, ci, ...secrets };
  const generate = () => {
    setSecrets({ token: randomHex32(), signingKey: randomHex32() });
    if (tab === 'turbo' || tab === 'ci') {
      setTab('local');
    }
  };
  const clear = () => {
    setSecrets(EMPTY_SECRETS);
  };
  const selectCi = (nextCi: CiProvider) => {
    setCi(nextCi);
    setTab('ci');
  };
  return {
    apiUrl,
    teamSlug,
    signing,
    ci,
    tab,
    hasSecrets: Boolean(secrets.token || secrets.signingKey),
    code: buildOutput(tab, input),
    setApiUrl,
    setTeamSlug,
    setSigning,
    setTab,
    selectCi,
    generate,
    clear,
  };
}

export default function ConfigBuilder() {
  const state = useBuilderState();
  const { copied, copy } = useCopyText();

  return (
    <div className="not-prose my-6 overflow-hidden rounded-blume border border-border bg-muted/40">
      <BuilderHeader
        hasSecrets={state.hasSecrets}
        signing={state.signing}
        onGenerate={state.generate}
        onClear={state.clear}
      />
      <div className="space-y-4 p-4">
        <TextInputs
          apiUrl={state.apiUrl}
          teamSlug={state.teamSlug}
          onApiUrl={state.setApiUrl}
          onTeamSlug={state.setTeamSlug}
        />
        <OptionRow
          signing={state.signing}
          ci={state.ci}
          onSigning={state.setSigning}
          onCi={state.selectCi}
        />
        <OutputPane
          tab={state.tab}
          filename={outputFilename(state.tab, state.ci)}
          code={state.code}
          copied={copied}
          onTab={state.setTab}
          onCopy={() => {
            copy(state.code).catch(() => undefined);
          }}
        />
      </div>
    </div>
  );
}
