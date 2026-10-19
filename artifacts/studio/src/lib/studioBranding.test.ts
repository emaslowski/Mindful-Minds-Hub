import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatStudioBrandLabel, normalizeStudioBranding } from './studioBranding';

test('legacy branding uses The Brightside Project without duplicating The', () => {
  assert.equal(formatStudioBrandLabel('Middle School Matters Team'), 'The Brightside Project Team');
  assert.equal(formatStudioBrandLabel('The Middle School Matters Studio'), 'The Brightside Project Studio');
  assert.equal(formatStudioBrandLabel('middle school matters Blog Team'), 'The Brightside Project Blog Team');
  assert.equal(formatStudioBrandLabel('Mind Matters Student Team'), 'The Brightside Project Student Team');
  assert.equal(formatStudioBrandLabel('Grade 5 Middle School Matters Team'), 'Grade 5 Brightside Project Team');
  assert.equal(formatStudioBrandLabel('The Brightside Project Team'), 'The Brightside Project Team');
});

test('saved publication labels and author options use consistent branding', () => {
  const result = normalizeStudioBranding({
    publication: { authorDisplay: 'Middle School Matters Blog Team' },
    authorDisplayOptions: ['Middle School Matters Blog Team', 'The Brightside Project Blog Team', 'Student Wellness Team'],
  });
  assert.equal(result.publication.authorDisplay, 'The Brightside Project Blog Team');
  assert.deepEqual(result.authorDisplayOptions, ['The Brightside Project Blog Team', 'Student Wellness Team']);
});

test('student writing, accounts, identifiers, and source objects remain unchanged', () => {
  const source = {
    user: { id: 5, username: 'middleschoolmatters', displayName: 'Middle School Matters', teamName: 'Middle School Matters Team' },
    project: { title: 'Middle School Matters', content: 'Our Middle School Matters article', notes: 'Middle School Matters', blocks: [{ text: 'Middle School Matters' }] },
  };
  const result = normalizeStudioBranding(source);
  assert.deepEqual(result.project, source.project);
  assert.equal(result.user.id, source.user.id);
  assert.equal(result.user.username, source.user.username);
  assert.equal(result.user.displayName, source.user.displayName);
  assert.equal(result.user.teamName, 'The Brightside Project Team');
  assert.equal(source.user.teamName, 'Middle School Matters Team');
  assert.equal(normalizeStudioBranding(null), null);
});

test('team administration names are formatted only for team responses', () => {
  const source = { teams: [{ id: 1, name: 'Middle School Matters Team' }] };
  assert.equal(normalizeStudioBranding(source).teams[0].name, 'Middle School Matters Team');
  assert.equal(normalizeStudioBranding(source, true).teams[0].name, 'The Brightside Project Team');
});
