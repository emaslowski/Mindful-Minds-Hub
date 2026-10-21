import assert from 'node:assert/strict';
import { db, pool, studioProjectsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { createStudioSession, deleteStudioSession } from '../src/lib/studioAuth';

// Development only: exercises real teacher publishing and removes its own data.
if (process.env.NODE_ENV === 'production') throw new Error('Development test only');
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const destinations = [
  'move-morning-stretch', 'move-soccer-skills', 'move-basketball-drills',
  'move-yoga-for-calm', 'move-stretch-break', 'move-active-challenge', 'directed-draws',
];
const title = '__activity_publication_integration__';
const session = await createStudioSession({
  studioUser: {
    id: 'activity-publication-test', email: null, displayName: 'Publication test',
    role: 'teacher', accountStatus: 'active',
  },
});
const headers = { Authorization: `StudioBearer ${session}`, 'Content-Type': 'application/json' };
let projectId: number | undefined;
try {
  const created = await fetch(`${origin}/api/teacher/projects`, {
    method: 'POST', headers, body: JSON.stringify({ title, contentType: 'Movement activity' }),
  });
  assert.equal(created.status, 201, await created.clone().text());
  projectId = (await created.json()).project.id;
  await db.update(studioProjectsTable).set({ content: 'A gentle activity for testing publication destinations.' })
    .where(eq(studioProjectsTable.id, projectId!));
  for (const destinationSection of destinations) {
    const published = await fetch(`${origin}/api/teacher/projects/${projectId}/decision`, {
      method: 'POST', headers,
      body: JSON.stringify({ decision: 'approve_and_publish', destinationSection }),
    });
    assert.equal(published.status, 200, await published.clone().text());
    const listing = await fetch(`${origin}/api/public/published?section=${destinationSection}`);
    assert.equal(listing.status, 200);
    const { publications } = await listing.json();
    assert(publications.some((item: { projectId: number }) => item.projectId === projectId));
    console.log(`PASS publish and public listing: ${destinationSection}`);
  }
  const invalid = await fetch(`${origin}/api/teacher/projects/${projectId}/decision`, {
    method: 'POST', headers,
    body: JSON.stringify({ decision: 'approve_and_publish', destinationSection: 'move-invalid' }),
  });
  assert.equal(invalid.status, 400);
  const anonymous = await fetch(`${origin}/api/teacher/projects/${projectId}/decision`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'approve_and_publish', destinationSection: 'directed-draws' }),
  });
  assert.equal(anonymous.status, 401);
  console.log('PASS invalid destinations and anonymous publishing rejected');
} finally {
  if (projectId) await db.delete(studioProjectsTable).where(eq(studioProjectsTable.id, projectId));
  await deleteStudioSession(session);
  await pool.end();
}
