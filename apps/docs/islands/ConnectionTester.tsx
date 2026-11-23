import { useState } from 'react';

import type { ProbeResult, ProbeStatus } from '../lib/connection-check';

import { normalizeServerUrl, runConnectionDiagnostic } from '../lib/connection-check';

export const client = 'visible';

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none';

const badgeStyles: Record<ProbeStatus, string> = {
  pass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  fail: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
};

const badgeLabels: Record<ProbeStatus, string> = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };

interface OriginFieldsProps {
  url: string;
  team: string;
  onUrl: (value: string) => void;
  onTeam: (value: string) => void;
}

interface TokenFieldProps {
  token: string;
  showToken: boolean;
  onToken: (value: string) => void;
  onToggleToken: () => void;
}

interface FeedbackProps {
  error: string | null;
  note: string | null;
  results: ProbeResult[] | null;
}

function ProbeRow({ result }: { result: ProbeResult }) {
  return (
    <div className="rounded-md border border-border bg-background px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${badgeStyles[result.status]}`}
          >
            {badgeLabels[result.status]}
          </span>
          <span className="text-sm font-medium text-foreground">{result.label}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {result.httpStatus === null ? '—' : `HTTP ${String(result.httpStatus)}`} ·{' '}
          {String(result.latencyMs)} ms
        </span>
      </div>
      <p className="mt-1.5 text-sm text-foreground">{result.summary}</p>
      {result.hint ? <p className="mt-1 text-xs text-muted-foreground">{result.hint}</p> : null}
    </div>
  );
}

function OriginFields({ url, team, onUrl, onTeam }: OriginFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Server origin</span>
        <input
          type="url"
          value={url}
          onChange={(event) => {
            onUrl(event.target.value);
          }}
          placeholder="https://turborepo-remote-cache.acme.workers.dev"
          className={INPUT_CLASS}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Team slug <span className="font-normal">(optional)</span>
        </span>
        <input
          type="text"
          value={team}
          onChange={(event) => {
            onTeam(event.target.value);
          }}
          placeholder="my-team"
          className={INPUT_CLASS}
        />
      </label>
    </div>
  );
}

function TokenField({ token, showToken, onToken, onToggleToken }: TokenFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">TURBO_TOKEN</span>
      <div className="flex gap-2">
        <input
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={(event) => {
            onToken(event.target.value);
          }}
          placeholder="Paste your bearer token"
          autoComplete="off"
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={onToggleToken}
          className="shrink-0 cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {showToken ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  );
}

function ProbeFeedback({ error, note, results }: FeedbackProps) {
  return (
    <>
      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      {results ? (
        <div className="space-y-2 pt-1">
          {results.map((result) => (
            <ProbeRow key={result.id} result={result} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function SubmitBar({ running }: { running: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-xs text-muted-foreground">
        Calls <code className="font-mono">GET /v8/artifacts/status</code> and a read-only{' '}
        <code className="font-mono">HEAD</code> probe directly from your browser.
      </p>
      <button
        type="submit"
        disabled={running}
        className="cursor-pointer rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? 'Testing...' : 'Test connection'}
      </button>
    </div>
  );
}

function useConnectionProbe() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [results, setResults] = useState<ProbeResult[] | null>(null);

  const run = async (url: string, token: string, team: string) => {
    const normalized = normalizeServerUrl(url);
    if (normalized.error || !token.trim()) {
      setError(normalized.error ?? 'Enter your TURBO_TOKEN to test authentication.');
      setResults(null);
      return;
    }
    setError(null);
    setNote(
      normalized.strippedV8
        ? `Stripped /v8 suffix — testing bare origin ${normalized.origin}.`
        : null,
    );
    setRunning(true);
    try {
      setResults(await runConnectionDiagnostic(normalized.origin, token.trim(), team));
    } finally {
      setRunning(false);
    }
  };

  return { running, error, note, results, run };
}

export default function ConnectionTester() {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [team, setTeam] = useState('my-team');
  const [showToken, setShowToken] = useState(false);
  const probe = useConnectionProbe();

  return (
    <div className="not-prose my-6 overflow-hidden rounded-blume border border-border bg-muted/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="text-sm font-semibold text-foreground">Live deployment check</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Browser → your server only
        </span>
      </div>
      <form
        className="space-y-3.5 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          probe.run(url, token, team).catch(() => undefined);
        }}
      >
        <OriginFields url={url} team={team} onUrl={setUrl} onTeam={setTeam} />
        <TokenField
          token={token}
          showToken={showToken}
          onToken={setToken}
          onToggleToken={() => {
            setShowToken((value) => !value);
          }}
        />
        <SubmitBar running={probe.running} />
        <ProbeFeedback error={probe.error} note={probe.note} results={probe.results} />
      </form>
    </div>
  );
}
