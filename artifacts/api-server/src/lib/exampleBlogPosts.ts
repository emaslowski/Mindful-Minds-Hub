import { createHash } from 'node:crypto';

// Only the original example articles are excluded. Matching their entire
// title/author/content preserves genuine posts, including edited examples
// and real articles that happen to use one of these titles.
const EXAMPLE_FINGERPRINTS = new Set([
  'cd5318cdd2b575b4d3e9342e24f104fa547b06ac0996cb7430a6c579548d428f',
  '76e6510c82f03f1a8b53b0c119063431262ef3e3673127adf11941b50386d80b',
  'd28303b03b92dcbec1467cc51cd39475f29836b022acfc716ac00ba566ce96e1',
]);

export function isExampleBlogPost(post: { title: string; author: string; content: string }): boolean {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([post.title, post.author, post.content]))
    .digest('hex');
  return EXAMPLE_FINGERPRINTS.has(fingerprint);
}
