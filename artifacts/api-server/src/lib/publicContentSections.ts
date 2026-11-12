const ROOTS = new Set([
  '/', '/learn', '/create', '/connect', '/move', '/listen', '/grow',
  '/gardening', '/language-corner', '/games', '/resources', '/events', '/review',
]);

export function publicContentSection(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 180) return null;
  const path = value.replace(/\/+$/, '') || '/';
  if (ROOTS.has(path)) return path;
  if (/^\/content\/publication\/[1-9][0-9]*$/.test(path)) return path;
  // Explicit public routes only. Never allow private journal/identity paths.
  if (/^\/learn\/[a-z0-9-]+$/.test(path)) return path;
  if (/^\/create\/[a-z0-9-]+$/.test(path)) return path;
  if (/^\/create\/cooking\/(?:videos|recipes\/[a-z0-9-]+)$/.test(path)) return path;
  if (/^\/connect\/(?:blog|post)\/[0-9]+$/.test(path)) {
    return path.replace('/connect/post/', '/connect/blog/');
  }
  if (/^\/(?:move|listen)\/[a-z0-9-]+$/.test(path)) return path;
  if (path === '/grow/collab') return path;
  return null;
}
