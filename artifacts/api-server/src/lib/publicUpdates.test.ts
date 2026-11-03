import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newestUpdates, UPDATE_DESTINATIONS } from './publicUpdates';

test('homepage updates use publication date, newest first, with a six-item limit', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id: `post-${i}`, title: 'Published title', section: 'Cooking',
    href: '/create/cooking', publishedAt: `2026-11-0${i + 1}T12:00:00Z`,
  }));
  const result = newestUpdates(items);
  assert.equal(result.length, 6);
  assert.deepEqual(result.map(item => item.id), ['post-7', 'post-6', 'post-5', 'post-4', 'post-3', 'post-2']);
  assert.equal(items[0].id, 'post-0');
});

test('invalid dates are never presented as recent posts', () => {
  assert.deepEqual(newestUpdates([{ id: 'bad', title: 'Bad', section: 'Blog', href: '/connect', publishedAt: 'invalid' }]), []);
});

test('every teacher publishing destination has a public route', () => {
  for (const section of [
    'blog', 'podcast', 'learn', 'create', 'calm-corner', 'focus-study',
    'move', 'move-morning-stretch', 'move-soccer-skills', 'move-basketball-drills',
    'move-yoga-for-calm', 'move-stretch-break', 'move-active-challenge',
    'directed-draws', 'cooking', 'cooking-food-reviews', 'gardening', 'grow',
    'events', 'resources',
  ]) assert.ok(UPDATE_DESTINATIONS[section]?.href.startsWith('/'));
});
