/** Relocate the already-published dance recording without changing student
 * originals, teacher drafts, or the media references in its published edition.
 * Only active publications are passed here by the public content endpoints.
 */
export function publicationDestination(destination: string, title: string): string {
  if (destination === 'create' && title.trim().toLowerCase() === 'dance tutorial') {
    return 'dance-tutorials';
  }
  return destination;
}
