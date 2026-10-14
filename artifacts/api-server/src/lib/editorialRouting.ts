import { db, studioJobsTable, studioProjectsTable } from '@workspace/db';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { logger } from './logger';

export function findEditorialJobId(jobs: { id: number; title: string }[]): number | null {
  const matches = jobs.filter((job) =>
    /^editors?anddesigners?$/.test(job.title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '')));
  return matches.length === 1 ? matches[0]!.id : null;
}

export async function resolveEditorialJobId(): Promise<number | null> {
  const jobs = await db.select({ id: studioJobsTable.id, title: studioJobsTable.title }).from(studioJobsTable);
  return findEditorialJobId(jobs);
}

/** Repair orphaned automatic assignments only. Preserve teacher-selected,
 * existing individual/group reviewers, project content, status and history. */
export async function repairOrphanedEditorialAssignments() {
  const editorJobId = await resolveEditorialJobId();
  if (editorJobId == null) {
    logger.warn('Editorial routing needs exactly one Editors & Designers job group');
    return;
  }
  const orphanedAssignment = and(
    eq(studioProjectsTable.status, 'Peer Review'),
    isNull(studioProjectsTable.peerReviewerId),
    sql`NOT EXISTS (SELECT 1 FROM studio_jobs j WHERE j.id = ${studioProjectsTable.peerReviewerJobId})`,
  );
  const waiting = await db.select({ id: studioProjectsTable.id }).from(studioProjectsTable).where(orphanedAssignment);
  let repaired = 0;
  for (const project of waiting) {
    await db.transaction(async (tx) => {
      // Coordinate with submissions and teacher reassignment.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${project.id})`);
      const rows = await tx.update(studioProjectsTable)
        .set({ peerReviewerJobId: editorJobId })
        .where(and(eq(studioProjectsTable.id, project.id), orphanedAssignment))
        .returning({ id: studioProjectsTable.id });
      repaired += rows.length;
    });
  }
  if (repaired) logger.info({ repaired }, 'Restored orphaned peer reviews to the current Editors & Designers group');
}
