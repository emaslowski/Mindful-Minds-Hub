import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??= 'postgres://u:p@localhost:5432/placeholder';
const { parseEmailList, adminEmails } = await import('./notifications');

describe('notification email list', () => {
  it('cleans, lower-cases and de-duplicates addresses', () => {
    assert.deepEqual(parseEmailList([' Teacher@School.org ', 'teacher@school.org', 'b@x.io', '']), ['teacher@school.org', 'b@x.io']);
    assert.deepEqual(parseEmailList('a@b.co, c@d.org'), ['a@b.co', 'c@d.org']);
    assert.deepEqual(parseEmailList([]), []);
  });

  it('rejects anything that is not an email address', () => {
    assert.equal(parseEmailList(['not an email']), null);
    assert.equal(parseEmailList(['a@b']), null);
    assert.equal(parseEmailList([42]), null);
    assert.equal(parseEmailList({ email: 'a@b.co' }), null);
  });

  it('reads ADMIN_EMAILS as the fallback', () => {
    const saved = process.env.ADMIN_EMAILS;
    try {
      process.env.ADMIN_EMAILS = 'one@school.org, Two@School.org';
      assert.deepEqual(adminEmails(), ['one@school.org', 'two@school.org']);
    } finally {
      if (saved === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = saved;
    }
  });
});
