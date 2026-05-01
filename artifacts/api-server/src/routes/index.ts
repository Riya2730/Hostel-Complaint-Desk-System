import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import complaintsRouter from "./complaints";
import adminRouter from "./admin";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(complaintsRouter);
router.use(adminRouter);
router.use(staffRouter);

export default router;
