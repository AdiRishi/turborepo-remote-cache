import { defineMeta } from 'blume';

export default defineMeta({
  title: 'Deploy',
  icon: 'cloud',
  order: 2,
  pages: ['cloudflare', 'node', 'vercel', 'netlify', 'aws-lambda'],
});
