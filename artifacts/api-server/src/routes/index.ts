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

export default router;
