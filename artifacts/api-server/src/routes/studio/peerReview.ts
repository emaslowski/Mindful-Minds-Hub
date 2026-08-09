import { db } from '@workspace/db';
import {
  studioPeerReviewsTable,
  studioProjectsTable,
  studioProjectContributorsTable,
  studioSafetyFlagsTable,
} from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';
import { checkContent } from '../../lib/safetyCheck';

const router = Router();

// GET /api/studio/peer-reviews — projects assigned to this user/group for peer review
router.get(
  '/studio/peer-reviews',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    // Job-group sessions: find projects where peerReviewerJobId matches their job
    if (req.studioUser!.jobId != null) {
      const projects = await db
        .select()
        .from(studioProjectsTable)
        .where(
          and(
            eq(studioProjectsTable.peerReviewerJobId, req.studioUser!.jobId),
            eq(studioProjectsTable.status, 'Peer Review'),
          ),
        );
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

    const reviews = await db
      .select()
      .from(studioPeerReviewsTable)
      .where(eq(studioPeerReviewsTable.projectId, projectId));

    res.json({ reviews });
  },
);

// POST /api/studio/peer-reviews/:projectId/submit — submit peer review checklist
router.post(
  '/studio/peer-reviews/:projectId/submit',
  requireStudioRole('student'),
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

    if (!isJobReviewer && project.peerReviewerId !== req.studioUser!.id) {
      res.status(403).json({ error: 'You are not the assigned peer reviewer for this project' });
      return;
    }

    if (project.status !== 'Peer Review') {
      res.status(400).json({ error: 'This project is not currently in Peer Review status' });
      return;
    }

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

    // Safety check on reviewer's comment — silent flag only
    if (comments) {
      const safety = checkContent(comments);
      if (safety.flagged) {
        await db
          .insert(studioSafetyFlagsTable)
          .values({
            projectId,
            flagReason: safety.reasons.join('; '),
            teacherAttentionRecommended: true,
          })
          .onConflictDoNothing();
      }
    }

    // Use jobId as varchar reviewerId for job-group sessions (it's a valid unique identifier)
    const reviewerId = isJobReviewer
      ? String(req.studioUser!.jobId)
      : req.studioUser!.id;

    const [review] = await db
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
      await db
        .insert(studioProjectContributorsTable)
        .values({
          projectId,
          studentId: req.studioUser!.id,
          contributionType: 'peer_reviewer',
          cycleId: project.currentCycleId,
        })
        .onConflictDoNothing();
    }

    // Advance project status based on review recommendation
    const nextStatus = recommendRevision ? 'Revision Needed' : 'Ready for Teacher Review';
    await db
      .update(studioProjectsTable)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(studioProjectsTable.id, projectId));

    res.status(201).json({ review, nextStatus });
  },
);

export default router;
