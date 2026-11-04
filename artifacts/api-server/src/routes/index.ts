import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import anonymousAccessRouter from "./anonymousAccess";
import blogRouter from "./blog";
import journalRouter from "./journal";
import plantJournalRouter from "./plantJournal";
import collabRouter from "./collab";
import analyticsRouter from "./analytics";
import checkinRouter from "./checkin";
import reviewsRouter from "./reviews";
import contentCommentsRouter from "./contentComments";
import publicUpdatesRouter from "./publicUpdates";
import eventsRouter from "./events";
import contactRouter from "./contact";
import friendshipRouter from "./friendship";
import artworkRouter from "./artwork";
import athleteRouter from "./athlete";
import homepageVideoRouter from "./homepageVideo";
import featuredChefVideoRouter from "./featuredChefVideo";
import coloringPagesRouter from "./coloringPages";
// Studio routes
import studioAuthRouter from "./studio/auth";
import studioProjectsRouter from "./studio/projects";
import studioSourcesRouter from "./studio/sources";
import studioPeerReviewRouter from "./studio/peerReview";
import studioVideoProductionsRouter from "./studio/videoProductions";
import studioPortfolioRouter from "./studio/portfolio";
import teacherStudentsRouter from "./studio/teacher/students";
import teacherTeamsJobsRouter from "./studio/teacher/teamsJobs";
import teacherCyclesRouter from "./studio/teacher/cycles";
import teacherReviewRouter from "./studio/teacher/review";
import teacherPublicationMediaRouter from "./studio/teacher/publicationMedia";
import teacherHandoffsRouter from "./studio/teacher/handoffs";
import teacherAnalyticsRouter from "./studio/teacher/analytics";
import teacherSettingsRouter from "./studio/teacher/settings";
import teacherModerationRouter from "./studio/teacher/moderation";
import publicContentRouter from "./studio/publicContent";
import { requireRole } from "../middlewares/requireRoleMiddleware";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(anonymousAccessRouter);
router.use(blogRouter);
router.use(journalRouter);
router.use(plantJournalRouter);
router.use(collabRouter);
router.use(analyticsRouter);
router.use(checkinRouter);
router.use(reviewsRouter);
router.use(contentCommentsRouter);
router.use(publicUpdatesRouter);
router.use(eventsRouter);
router.use(contactRouter);
router.use(friendshipRouter);
router.use(artworkRouter);
router.use(athleteRouter);
router.use(homepageVideoRouter);
router.use(featuredChefVideoRouter);
router.use(coloringPagesRouter);
// Studio — student
router.use(studioAuthRouter);
router.use(studioProjectsRouter);
router.use(studioSourcesRouter);
router.use(studioPeerReviewRouter);
router.use(studioVideoProductionsRouter);
router.use(studioPortfolioRouter);
// Studio — teacher
router.use(teacherStudentsRouter);
router.use(teacherTeamsJobsRouter);
router.use(teacherCyclesRouter);
router.use(teacherReviewRouter);
router.use(teacherPublicationMediaRouter);
router.use(teacherHandoffsRouter);
router.use(teacherAnalyticsRouter);
router.use(teacherSettingsRouter);
router.use(teacherModerationRouter);
// Public (no auth)
router.use(publicContentRouter);

// Studio API routes — gated by role (added in the next task)
// Students and teachers can access /studio routes
router.use('/studio', requireRole('student', 'teacher'), Router());
// Only teachers can access /teacher routes
router.use('/teacher', requireRole('teacher'), Router());

export default router;
