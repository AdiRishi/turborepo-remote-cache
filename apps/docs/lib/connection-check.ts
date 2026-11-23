export type ProbeStatus = 'pass' | 'fail' | 'warn';

export interface ProbeResult {
  id: 'status' | 'storage';
  label: string;
  status: ProbeStatus;
  httpStatus: number | null;
  latencyMs: number;
  summary: string;
  hint?: string;
}

export interface NormalizedOrigin {
  origin: string;
  strippedV8: boolean;
  error?: string;
}

const PROBE_HASH = '0000000000000000';
const TRAILING_SLASHES = /\/+$/u;
const V8_SUFFIX = /\/v8(?:\/.*)?$/iu;
const STATUS_LABEL = 'API & authentication';
const STORAGE_LABEL = 'Storage backend (read-only probe)';

export const normalizeServerUrl = (raw: string): NormalizedOrigin => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { origin: '', strippedV8: false, error: 'Enter your server URL first.' };
  }
  const withScheme = /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    return {
      origin: parsed.origin.replace(TRAILING_SLASHES, ''),
      strippedV8: V8_SUFFIX.test(parsed.pathname),
    };
  } catch {
    return {
      origin: '',
      strippedV8: false,
      error: 'Enter a valid origin, such as https://cache.example.com.',
    };
  }
};

const isHtmlResponse = (response: Response) =>
  (response.headers.get('content-type') ?? '').toLowerCase().includes('text/html');

const isEnabledPayload = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && 'status' in value && value.status === 'enabled';

const statusResult = (
  status: ProbeStatus,
  httpStatus: number | null,
  latencyMs: number,
  summary: string,
  hint?: string,
): ProbeResult => ({
  id: 'status',
  label: STATUS_LABEL,
  status,
  httpStatus,
  latencyMs,
  summary,
  hint,
});

const classifyOkStatus = async (response: Response, latencyMs: number): Promise<ProbeResult> => {
  if (isHtmlResponse(response)) {
    return statusResult(
      'fail',
      200,
      latencyMs,
      'Received HTML instead of JSON',
      'Cloudflare Access, Vercel Deployment Protection, or a proxy is intercepting /v8/*. Allow bearer-authenticated traffic on /v8/*.',
    );
  }
  const payload: unknown = await response.json().catch(() => null);
  if (isEnabledPayload(payload)) {
    return statusResult('pass', 200, latencyMs, 'Authenticated — Remote Cache API enabled');
  }
  return statusResult(
    'warn',
    200,
    latencyMs,
    'Unexpected JSON payload from /v8/artifacts/status',
    'Confirm this URL points to your Turborepo Remote Cache server.',
  );
};

const classifyStatusResponse = (response: Response, latencyMs: number): Promise<ProbeResult> => {
  if (response.status === 200) {
    return classifyOkStatus(response, latencyMs);
  }
  if (response.status === 401) {
    return Promise.resolve(
      statusResult(
        'fail',
        401,
        latencyMs,
        '401 Unauthorized — token rejected',
        'Check that TURBO_TOKEN matches the secret configured on your server.',
      ),
    );
  }
  if (response.status === 500) {
    return Promise.resolve(
      statusResult(
        'fail',
        500,
        latencyMs,
        '500 Server Error — likely missing server configuration',
        'Check server logs for "Invalid server configuration:" (often an unset TURBO_TOKEN secret).',
      ),
    );
  }
  return Promise.resolve(
    statusResult(
      'fail',
      response.status,
      latencyMs,
      `Unexpected HTTP ${String(response.status)}`,
      'Verify the deployment URL uses the bare origin with no path prefix.',
    ),
  );
};

const classifyStorageResponse = (response: Response, latencyMs: number): ProbeResult => {
  if (response.status === 404 || response.status === 200) {
    return {
      id: 'storage',
      label: STORAGE_LABEL,
      status: 'pass',
      httpStatus: response.status,
      latencyMs,
      summary: 'Storage backend reachable (no objects written)',
    };
  }
  if (response.status === 500) {
    return {
      id: 'storage',
      label: STORAGE_LABEL,
      status: 'fail',
      httpStatus: 500,
      latencyMs,
      summary: '500 Server Error — storage backend failed',
      hint: 'Check logs for missing R2_STORE/KV_STORE bindings or invalid S3_BUCKET, S3_ENDPOINT, or S3 credentials.',
    };
  }
  return {
    id: 'storage',
    label: STORAGE_LABEL,
    status: 'warn',
    httpStatus: response.status,
    latencyMs,
    summary: `HEAD probe returned HTTP ${String(response.status)}`,
    hint: 'Inspect your storage permissions (GetObject/HeadObject) and server logs.',
  };
};

const networkFailure = (id: ProbeResult['id'], label: string, latencyMs: number): ProbeResult => ({
  id,
  label,
  status: 'fail',
  httpStatus: null,
  latencyMs,
  summary: 'Network or CORS error — browser could not reach /v8/*',
  hint: 'Confirm DNS, TLS, and that no proxy or access gate is blocking CORS preflights to /v8/*.',
});

export const runConnectionDiagnostic = async (
  origin: string,
  token: string,
  teamSlug: string,
): Promise<ProbeResult[]> => {
  const headers = { Authorization: `Bearer ${token}` };
  const statusStart = performance.now();
  let first: ProbeResult;
  try {
    const response = await fetch(`${origin}/v8/artifacts/status`, { headers, mode: 'cors' });
    first = await classifyStatusResponse(response, Math.round(performance.now() - statusStart));
  } catch {
    return [networkFailure('status', STATUS_LABEL, Math.round(performance.now() - statusStart))];
  }

  if (first.status !== 'pass') {
    return [first];
  }

  const query = teamSlug.trim() ? `?slug=${encodeURIComponent(teamSlug.trim())}` : '';
  const storageStart = performance.now();
  try {
    const response = await fetch(`${origin}/v8/artifacts/${PROBE_HASH}${query}`, {
      method: 'HEAD',
      headers,
      mode: 'cors',
    });
    return [first, classifyStorageResponse(response, Math.round(performance.now() - storageStart))];
  } catch {
    return [
      first,
      networkFailure('storage', STORAGE_LABEL, Math.round(performance.now() - storageStart)),
    ];
  }
};
