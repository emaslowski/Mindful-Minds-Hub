import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicContentSection } from './publicContentSections';

test('all public content sections support discussions', () => {
  for (const path of [
    '/', '/learn', '/learn/breathing', '/create', '/create/directed-draws',
    '/create/cooking', '/create/cooking/videos', '/create/cooking/recipes/42',
    '/connect', '/connect/blog/4', '/move', '/move/yoga', '/listen',
    '/listen/podcast', '/grow', '/grow/collab', '/gardening',
    '/language-corner', '/games', '/resources', '/events', '/review',
  ]) assert.equal(publicContentSection(path), path);
});

test('private or unknown paths cannot become public threads', () => {
  for (const path of [
    '/grow/journal', '/grow/gratitude', '/gardening/journal', '/anonymous-access',
    '/checkin', '/contact', '/connect/submit', '/studio', '/teacher',
    '/does-not-exist', '/learn/foo/bar', '/learn/../grow/journal',
    'https://example.test/learn', '/games?secret=private', undefined, {},
  ]) assert.equal(publicContentSection(path), null);
});

test('aliases and trailing slashes use the same discussion thread', () => {
  assert.equal(publicContentSection('/connect/post/4'), '/connect/blog/4');
  assert.equal(publicContentSection('/games/'), '/games');
});
