import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import blogRouter from "./blog";
import journalRouter from "./journal";
import collabRouter from "./collab";
import analyticsRouter from "./analytics";
import checkinRouter from "./checkin";
import reviewsRouter from "./reviews";
import eventsRouter from "./events";
import contactRouter from "./contact";
// Studio routes
import studioAuthRouter from "./studio/auth";
import studioProjectsRouter from "./studio/projects";
import studioSourcesRouter from "./studio/sources";
import studioPeerReviewRouter from "./studio/peerReview";
import studioPortfolioRouter from "./studio/portfolio";
import teacherStudentsRouter from "./studio/teacher/students";
import teacherTeamsJobsRouter from "./studio/teacher/teamsJobs";
import teacherCyclesRouter from "./studio/teacher/cycles";
import teacherReviewRouter from "./studio/teacher/review";
import teacherHandoffsRouter from "./studio/teacher/handoffs";
import teacherAnalyticsRouter from "./studio/teacher/analytics";
import publicContentRouter from "./studio/publicContent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(blogRouter);
router.use(journalRouter);
router.use(collabRouter);
router.use(analyticsRouter);
router.use(checkinRouter);
router.use(reviewsRouter);
router.use(eventsRouter);
router.use(contactRouter);
// Studio — student
router.use(studioAuthRouter);
router.use(studioProjectsRouter);
router.use(studioSourcesRouter);
router.use(studioPeerReviewRouter);
router.use(studioPortfolioRouter);
// Studio — teacher
router.use(teacherStudentsRouter);
router.use(teacherTeamsJobsRouter);
router.use(teacherCyclesRouter);
router.use(teacherReviewRouter);
router.use(teacherHandoffsRouter);
router.use(teacherAnalyticsRouter);
// Public (no auth)
router.use(publicContentRouter);

export default router;
