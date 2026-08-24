import { db } from '@workspace/db';
import {
  studioPeerReviewsTable,
  studioProjectsTable,
  studioProjectContributorsTable,
  studioSafetyFlagsTable,
} from '@workspace/db/schema';
import { eq, and, desc, ne, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import { checkContent } from '../../lib/safetyCheck';

const router = Router();

// GET /api/studio/peer-reviews — projects assigned to this user/group for peer review
router.get(
  '/studio/peer-reviews',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    // Job-group sessions: find projects where peerReviewerJobId matches their job.
    // Keep completed assignments in the response so the Studio inbox can
    // distinguish work that still needs review from work this group finished.
    if (req.studioUser!.jobId != null) {
      const projects = await db
        .select()
        .from(studioProjectsTable)
        .where(
          and(
            eq(studioProjectsTable.peerReviewerJobId, req.studioUser!.jobId),
            ne(studioProjectsTable.status, 'Archived'),
          ),
        )
        .orderBy(desc(studioProjectsTable.updatedAt));
      res.json({ projects });
      return;
    }

    const projects = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.peerReviewerId, req.studioUser!.id));

    res.json({ projects });
  },
);

// GET /api/studio/peer-reviews/:projectId — get existing reviews for a project
router.get(
  '/studio/peer-reviews/:projectId',
  requireStudioRole('student', 'teacher'),
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.id, projectId));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const isJobReviewer =
      req.studioUser!.jobId != null &&
      project.peerReviewerJobId === req.studioUser!.jobId;

    if (
      req.studioUser!.role === 'student' &&
      project.peerReviewerId !== req.studioUser!.id &&
      !isJobReviewer
    ) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Teachers need the full review history. Reviewers only need their own
    // submission state; exposing an earlier review here would incorrectly
    // block a newly assigned reviewer from completing the reassigned work.
    const reviews = await db
      .select()
      .from(studioPeerReviewsTable)
      .where(
        req.studioUser!.role === 'teacher'
          ? eq(studioPeerReviewsTable.projectId, projectId)
          : and(
              eq(studioPeerReviewsTable.projectId, projectId),
              eq(studioPeerReviewsTable.reviewerId, req.studioUser!.id),
            ),
      );

    res.json({ reviews });
  },
);

// POST /api/studio/peer-reviews/:projectId/submit — submit peer review checklist
router.post(
  '/studio/peer-reviews/:projectId/submit',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);

    const {
      checklistInfoClear,
      checklistAgeAppropriate,
      checklistSourcesIncluded,
      checklistFactsAccurate,
      checklistLanguageRespectful,
      checklistNoPrivateInfo,
      checklistGrammarChecked,
      checklistFitsMission,
      comments,
      recommendRevision,
    } = req.body as {
      checklistInfoClear?: boolean;
      checklistAgeAppropriate?: boolean;
      checklistSourcesIncluded?: boolean;
      checklistFactsAccurate?: boolean;
      checklistLanguageRespectful?: boolean;
      checklistNoPrivateInfo?: boolean;
      checklistGrammarChecked?: boolean;
      checklistFitsMission?: boolean;
      comments?: string;
      recommendRevision?: boolean;
    };

    // Individual and job-group sessions both provide a stable reviewer identity.
    const reviewerId = req.studioUser!.id;
    const safety = comments ? checkContent(comments) : null;

    const submission = await db.transaction(async (tx) => {
      // Job-group sessions may be active in multiple browser tabs. Serializing
      // submissions per project prevents duplicate reviews and conflicting
      // status transitions without discarding historical reviewer records.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${projectId})`);

      const [project] = await tx
        .select()
        .from(studioProjectsTable)
        .where(eq(studioProjectsTable.id, projectId));

      if (!project) return { error: { status: 404, message: 'Project not found' } };

      const isJobReviewer =
        req.studioUser!.jobId != null &&
        project.peerReviewerJobId === req.studioUser!.jobId;

      if (!isJobReviewer && project.peerReviewerId !== reviewerId) {
        return { error: { status: 403, message: 'You are not the assigned peer reviewer for this project' } };
      }

      const [existingReview] = await tx
        .select({ id: studioPeerReviewsTable.id })
        .from(studioPeerReviewsTable)
        .where(
          and(
            eq(studioPeerReviewsTable.projectId, projectId),
            eq(studioPeerReviewsTable.reviewerId, reviewerId),
          ),
        );

      if (existingReview) {
        return { error: { status: 409, message: 'You have already submitted a review for this project' } };
      }

      if (project.status !== 'Peer Review') {
        return { error: { status: 400, message: 'This project is not currently in Peer Review status' } };
      }

      if (safety?.flagged) {
        await tx
          .insert(studioSafetyFlagsTable)
          .values({
            projectId,
            flagReason: safety.reasons.join('; '),
            teacherAttentionRecommended: true,
          })
          .onConflictDoNothing();
      }

      const [review] = await tx
        .insert(studioPeerReviewsTable)
        .values({
          projectId,
          reviewerId,
          checklistInfoClear: checklistInfoClear ?? null,
          checklistAgeAppropriate: checklistAgeAppropriate ?? null,
          checklistSourcesIncluded: checklistSourcesIncluded ?? null,
          checklistFactsAccurate: checklistFactsAccurate ?? null,
          checklistLanguageRespectful: checklistLanguageRespectful ?? null,
          checklistNoPrivateInfo: checklistNoPrivateInfo ?? null,
          checklistGrammarChecked: checklistGrammarChecked ?? null,
          checklistFitsMission: checklistFitsMission ?? null,
          comments: comments ?? null,
        })
        .returning();

      // Record contributor only for individual (non-job) sessions
      if (!isJobReviewer) {
        await tx
          .insert(studioProjectContributorsTable)
          .values({
            projectId,
            studentId: reviewerId,
            contributionType: 'peer_reviewer',
            cycleId: project.currentCycleId,
          })
          .onConflictDoNothing();
      }

      const nextStatus = recommendRevision ? 'Revision Needed' : 'Ready for Teacher Review';
      await tx
        .update(studioProjectsTable)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(studioProjectsTable.id, projectId));

      return { review, nextStatus };
    });

    if (submission.error) {
      res.status(submission.error.status).json({ error: submission.error.message });
      return;
    }

    res.status(201).json(submission);
  },
);

export default router;
