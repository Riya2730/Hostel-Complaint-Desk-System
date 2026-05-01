import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyJWT, authorizeRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/staff/list", verifyJWT, authorizeRole("admin"), async (req, res): Promise<void> => {
  const staffMembers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "staff"));

  res.json(staffMembers);
});

export default router;
