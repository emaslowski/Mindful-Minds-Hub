import { db } from '@workspace/db';
import {
  studioProjectsTable,
  studioProjectContributorsTable,
  studioPeerReviewsTable,
  studioHandoffsTable,
  studioClassCyclesTable,
} from '@workspace/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { requireStudioRole } from '../../middlewares/studioAuthMiddleware';

const router = Router();

// GET /api/studio/portfolio — private portfolio stats for logged-in student
router.get(
  '/studio/portfolio',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const studentId = req.studioUser!.id;

    const [projectsContributed] = await db
      .select({ count: count() })
      .from(studioProjectContributorsTable)
      .where(eq(studioProjectContributorsTable.studentId, studentId));

    const [peerReviewsDone] = await db
      .select({ count: count() })
      .from(studioPeerReviewsTable)
      .where(eq(studioPeerReviewsTable.reviewerId, studentId));

    // Published projects this student contributed to
    const contributed = await db
      .select({ projectId: studioProjectContributorsTable.projectId })
      .from(studioProjectContributorsTable)
      .where(eq(studioProjectContributorsTable.studentId, studentId));

    const contributedIds = contributed.map((c) => c.projectId);

    const ownProjects = await db
      .select({
        id: studioProjectsTable.id,
        title: studioProjectsTable.title,
        contentType: studioProjectsTable.contentType,
        status: studioProjectsTable.status,
        createdAt: studioProjectsTable.createdAt,
        updatedAt: studioProjectsTable.updatedAt,
      })
      .from(studioProjectsTable)
      .where(eq(studioProjectsTable.assignedStudentId, studentId))
      .orderBy(desc(studioProjectsTable.updatedAt));

    const [handoffsCreated] = await db
      .select({ count: count() })
      .from(studioHandoffsTable)
      .innerJoin(
        studioProjectsTable,
        eq(studioHandoffsTable.projectId, studioProjectsTable.id),
      )
      .where(eq(studioProjectsTable.assignedStudentId, studentId));

    const publishedCount = ownProjects.filter((p) => p.status === 'Published').length;
    const completedCount = ownProjects.filter((p) =>
      ['Published', 'Approved', 'Archived'].includes(p.status),
    ).length;

    res.json({
      portfolio: {
        projectsContributed: projectsContributed.count,
        peerReviewsCompleted: peerReviewsDone.count,
        publishedProjects: publishedCount,
        completedProjects: completedCount,
        handoffsCreated: handoffsCreated.count,
        projects: ownProjects,
      },
    });
  },
);

// POST /api/studio/handoffs — create a handoff record
router.post(
  '/studio/handoffs',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const {
      projectId,
      completedWork,
      remainingWork,
      ideas,
      notes,
    } = req.body as {
      projectId?: number;
      completedWork?: string;
      remainingWork?: string;
      ideas?: string;
      notes?: string;
    };

    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }

    const [project] = await db
      .select()
      .from(studioProjectsTable)
      .where(
        and(
          eq(studioProjectsTable.id, projectId),
          eq(studioProjectsTable.assignedStudentId, req.studioUser!.id),
        ),
      );

    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }

    const [handoff] = await db
      .insert(studioHandoffsTable)
      .values({
        projectId,
        previousCycleId: project.currentCycleId,
        completedWork: completedWork ?? '',
        remainingWork: remainingWork ?? '',
        ideas: ideas ?? '',
        notes: notes ?? '',
        teacherNotes: '',
        isVisible: false,
      })
      .returning();

    res.status(201).json({ handoff });
  },
);

// GET /api/studio/handoffs/incoming — handoffs visible to the current class
router.get(
  '/studio/handoffs/incoming',
  requireStudioRole('student'),
  async (req: Request, res: Response) => {
    const handoffs = await db
      .select({
        id: studioHandoffsTable.id,
        projectId: studioHandoffsTable.projectId,
        projectTitle: studioProjectsTable.title,
        contentType: studioProjectsTable.contentType,
        completedWork: studioHandoffsTable.completedWork,
        remainingWork: studioHandoffsTable.remainingWork,
        ideas: studioHandoffsTable.ideas,
        notes: studioHandoffsTable.notes,
        previousCycleName: studioClassCyclesTable.name,
      })
      .from(studioHandoffsTable)
      .innerJoin(studioProjectsTable, eq(studioHandoffsTable.projectId, studioProjectsTable.id))
      .leftJoin(studioClassCyclesTable, eq(studioHandoffsTable.previousCycleId, studioClassCyclesTable.id))
      .where(eq(studioHandoffsTable.isVisible, true));

    res.json({ handoffs });
  },
);

export default router;
