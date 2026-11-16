import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??= 'postgres://u:p@localhost:5432/placeholder';
const { resolveDatabaseUrl } = await import('@workspace/db');

describe('resolveDatabaseUrl', () => {
  it('swaps the database name in a TCP and in a Cloud SQL socket URL', () => {
    assert.equal(resolveDatabaseUrl('postgres://u:p@db.example:5432/brightside?sslmode=require', 'brightside_lincoln'),
      'postgres://u:p@db.example:5432/brightside_lincoln?sslmode=require');
    assert.equal(resolveDatabaseUrl('postgresql://u:p%40ss@/brightside?host=/cloudsql/proj:us-east1:brightside-db', 'brightside_lincoln'),
      'postgresql://u:p%40ss@/brightside_lincoln?host=/cloudsql/proj:us-east1:brightside-db');
  });

  it('leaves the URL alone without a name and rejects unsafe names', () => {
    assert.equal(resolveDatabaseUrl('postgres://u:p@h/brightside', undefined), 'postgres://u:p@h/brightside');
    assert.throws(() => resolveDatabaseUrl('postgres://u:p@h/brightside', 'bad name; drop'), /not a valid database name/);
    assert.throws(() => resolveDatabaseUrl('postgres://u:p@h/brightside', 'Lincoln'), /not a valid database name/);
  });
});
