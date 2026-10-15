import { db, studioPublicationEditsTable, type PublicationEdition } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { UpdateTeacherPublicationDraftBody } from '@workspace/api-zod';

export const defaultPublicationAppearance: PublicationEdition['appearance'] = {
  fontFamily: 'serif', fontSize: 'medium', alignment: 'left',
  accent: 'sage', spacing: 'comfortable',
};

export function originalPublicationEdition(project: { title: string; content: string | null }): PublicationEdition {
  return { title: project.title, content: project.content ?? '', appearance: defaultPublicationAppearance };
}

export function parsePublicationDraft(input: unknown) {
  const result = UpdateTeacherPublicationDraftBody.safeParse(input);
  if (!result.success || !Number.isSafeInteger(result.data.version) || !result.data.draft.title.trim()) return null;
  const { draft } = result.data;
  if (draft.pageOrder != null && !Number.isSafeInteger(draft.pageOrder)) return null;
  if (new Set(draft.blocks?.map(block => block.id)).size !== (draft.blocks?.length ?? 0)) return null;
  if (draft.blocks?.some(block => block.mediaId != null && !Number.isSafeInteger(block.mediaId))) return null;
  if (JSON.stringify(draft).length > 500_000) return null;
  return { draft: { ...result.data.draft, title: result.data.draft.title.trim() }, version: result.data.version };
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Caller holds the project's advisory lock. Version protects another teacher's edits. */
export async function storePublicationEdition(
  tx: Transaction, projectId: number, draft: PublicationEdition, version: number, publish: boolean,
) {
  const [existing] = await tx.select().from(studioPublicationEditsTable)
    .where(eq(studioPublicationEditsTable.projectId, projectId));
  if ((existing?.version ?? 0) !== version) return null;
  const nextVersion = version + 1;
  await tx.insert(studioPublicationEditsTable).values({
    projectId, draft, version: nextVersion, ...(publish ? { published: draft } : {}),
  }).onConflictDoUpdate({
    target: studioPublicationEditsTable.projectId,
    set: { draft, version: nextVersion, updatedAt: new Date(), ...(publish ? { published: draft } : {}) },
  });
  return { draft, version: nextVersion };
}
