import assert from 'node:assert/strict';
import test from 'node:test';
import { publicationDestination } from './publicationDestination';
import { UPDATE_DESTINATIONS } from './publicUpdates';

test('moves the existing dance tutorial out of Creative Activities', () => {
  assert.equal(publicationDestination('create', 'Dance Tutorial'), 'dance-tutorials');
  assert.equal(publicationDestination('create', '  DANCE TUTORIAL  '), 'dance-tutorials');
});

test('preserves unrelated publications and explicit teacher placement', () => {
  assert.equal(publicationDestination('create', 'Trunk or Treat'), 'create');
  assert.equal(publicationDestination('calm-corner', 'Meditation'), 'calm-corner');
  assert.equal(publicationDestination('dance-tutorials', 'New dance'), 'dance-tutorials');
  assert.equal(publicationDestination('move', 'Dance Tutorial'), 'move');
});

test('homepage updates link to the new dance collection', () => {
  const section = publicationDestination('create', 'Dance Tutorial');
  assert.equal(UPDATE_DESTINATIONS[section]?.href, '/listen/dance-tutorials');
});
