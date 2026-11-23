import { defineMeta } from 'blume';

export default defineMeta({
  title: 'Storage',
  icon: 'database',
  order: 3,
  pages: ['r2', 'kv', 's3', 'custom-adapter'],
});
