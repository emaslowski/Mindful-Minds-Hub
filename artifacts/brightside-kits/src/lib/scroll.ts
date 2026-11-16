/** Scroll to the element a "#hash" points at. Returns false when there is no such element yet. */
export function scrollToHash(hash: string): boolean {
  if (!hash || hash === '#') return false;
  let el: Element | null = null;
  try {
    el = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    el = null;
  }
  if (!el) return false;
  el.scrollIntoView({ block: 'start' });
  return true;
}
