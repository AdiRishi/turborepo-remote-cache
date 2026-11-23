export type CiProvider = 'github' | 'gitlab' | 'shell';
export type OutputTab = 'turbo' | 'local' | 'ci' | 'verify';

export const OUTPUT_TABS: readonly { id: OutputTab; label: string }[] = [
  { id: 'turbo', label: 'turbo.json' },
  { id: 'local', label: 'Local shell' },
  { id: 'ci', label: 'CI workflow' },
  { id: 'verify', label: 'Verify (curl)' },
];

export const CI_PROVIDERS: readonly { id: CiProvider; label: string }[] = [
  { id: 'github', label: 'GitHub Actions' },
  { id: 'gitlab', label: 'GitLab CI' },
  { id: 'shell', label: 'Other CI' },
];

export interface ConfigBuilderInput {
  apiUrl: string;
  teamSlug: string;
  signing: boolean;
  ci: CiProvider;
  token: string;
  signingKey: string;
}

const TRAILING_SLASHES = /\/+$/u;
const V8_SUFFIX = /\/v8(?:\/.*)?$/iu;

export const cleanOrigin = (raw: string) => {
  const trimmed = raw.trim().replace(TRAILING_SLASHES, '').replace(V8_SUFFIX, '');
  return trimmed || 'https://turborepo-remote-cache.<your-subdomain>.workers.dev';
};

export const cleanTeam = (raw: string) => raw.trim() || 'my-team';

export const randomHex32 = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const buildTurboJson = ({ apiUrl, teamSlug, signing }: ConfigBuilderInput) => {
  const remoteCache: Record<string, string | boolean> = {
    apiUrl: cleanOrigin(apiUrl),
    teamSlug: cleanTeam(teamSlug),
  };
  if (signing) {
    remoteCache.signature = true;
  }
  return JSON.stringify({ remoteCache }, null, 2);
};

export const buildLocalShell = ({ signing, token, signingKey }: ConfigBuilderInput) => {
  const lines = [`export TURBO_TOKEN='${token || '<your-token>'}'`];
  if (signing) {
    lines.push(`export TURBO_REMOTE_CACHE_SIGNATURE_KEY='${signingKey || '<your-signing-key>'}'`);
  }
  return lines.join('\n');
};

export const buildCiSnippet = ({ ci, signing }: ConfigBuilderInput) => {
  if (ci === 'github') {
    const envLines = ['      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}'];
    if (signing) {
      envLines.push(
        '      TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY }}',
      );
    }
    return [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    env:',
      ...envLines,
      '    steps:',
      '      - uses: actions/checkout@v7',
      '      # Install Node.js and dependencies here',
      '      - run: npm exec -- turbo run build',
    ].join('\n');
  }

  if (ci === 'gitlab') {
    const comment = signing
      ? '# Add masked TURBO_TOKEN and TURBO_REMOTE_CACHE_SIGNATURE_KEY under Settings > CI/CD > Variables.'
      : '# Add a masked TURBO_TOKEN variable under Settings > CI/CD > Variables.';
    return [
      comment,
      'build:',
      '  image: node:24',
      '  script:',
      '    # Install dependencies here',
      '    - npm exec -- turbo run build',
    ].join('\n');
  }

  const lines = ['export TURBO_TOKEN="$CACHE_TOKEN_SECRET"'];
  if (signing) {
    lines.push('export TURBO_REMOTE_CACHE_SIGNATURE_KEY="$CACHE_SIGNING_KEY_SECRET"');
  }
  lines.push('npm exec -- turbo run build');
  return lines.join('\n');
};

export const buildVerifySnippet = ({ apiUrl, token }: ConfigBuilderInput) => {
  const origin = cleanOrigin(apiUrl);
  const shownToken = token || '<your-token>';
  return [
    `CACHE_URL='${origin}'`,
    `TURBO_TOKEN='${shownToken}'`,
    '',
    'curl --fail-with-body "$CACHE_URL/ping"',
    'curl --fail-with-body -H "Authorization: Bearer $TURBO_TOKEN" "$CACHE_URL/v8/artifacts/status"',
  ].join('\n');
};

export const buildOutput = (tab: OutputTab, input: ConfigBuilderInput) => {
  if (tab === 'turbo') {
    return buildTurboJson(input);
  }
  if (tab === 'local') {
    return buildLocalShell(input);
  }
  if (tab === 'ci') {
    return buildCiSnippet(input);
  }
  return buildVerifySnippet(input);
};

export const outputFilename = (tab: OutputTab, ci: CiProvider) => {
  if (tab === 'turbo') {
    return 'turbo.json';
  }
  if (tab === 'local') {
    return 'shell';
  }
  if (tab === 'verify') {
    return 'curl';
  }
  if (ci === 'github') {
    return '.github/workflows/ci.yml';
  }
  if (ci === 'gitlab') {
    return '.gitlab-ci.yml';
  }
  return 'ci.sh';
};
