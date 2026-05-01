import { Router, type IRouter } from "express";
import { db, usersTable, complaintsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ChangeUserRoleBody, AssignComplaintBody } from "@workspace/api-zod";
import { verifyJWT, authorizeRole } from "../middlewares/auth";
import { sendComplaintAssignedToStaff, sendComplaintAssignedToStudent } from "../lib/email";

const router: IRouter = Router();

router.get("/admin/users", verifyJWT, authorizeRole("admin"), async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable);
  res.json(users);
});

router.put("/admin/change-role/:userId", verifyJWT, authorizeRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw ?? "", 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = ChangeUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, userId))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.put("/admin/assign", verifyJWT, authorizeRole("admin"), async (req, res): Promise<void> => {
  const parsed = AssignComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, parsed.data.complaintId));
  if (!existing) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const [staff] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.staffId));
  if (!staff || staff.role !== "staff") {
    res.status(400).json({ error: "User is not a staff member" });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set({ assignedTo: parsed.data.staffId, status: "in_progress" })
    .where(eq(complaintsTable.id, parsed.data.complaintId))
    .returning();

  const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));

  Promise.all([
    sendComplaintAssignedToStaff({
      staffEmail: staff.email,
      staffName: staff.name,
      complaintTitle: existing.title,
      complaintId: existing.id,
      location: existing.location,
      studentName: submitter?.name ?? "A student",
    }),
    submitter
      ? sendComplaintAssignedToStudent({
          studentEmail: submitter.email,
          studentName: submitter.name,
          complaintTitle: existing.title,
          complaintId: existing.id,
          staffName: staff.name,
        })
      : Promise.resolve(),
  ]).catch(() => {});

  res.json({
    ...updated,
    userName: submitter?.name ?? null,
    assignedToName: staff.name,
  });
});

router.put("/admin/complaints/:id/assign", verifyJWT, authorizeRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const parsed = AssignComplaintBody.safeParse({ ...req.body, complaintId: id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [staff] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.staffId));
  if (!staff || staff.role !== "staff") {
    res.status(400).json({ error: "User is not a staff member" });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set({ assignedTo: parsed.data.staffId, status: "in_progress" })
    .where(eq(complaintsTable.id, id))
    .returning();

  const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));

  Promise.all([
    sendComplaintAssignedToStaff({
      staffEmail: staff.email,
      staffName: staff.name,
      complaintTitle: existing.title,
      complaintId: id,
      location: existing.location,
      studentName: submitter?.name ?? "A student",
    }),
    submitter
      ? sendComplaintAssignedToStudent({
          studentEmail: submitter.email,
          studentName: submitter.name,
          complaintTitle: existing.title,
          complaintId: id,
          staffName: staff.name,
        })
      : Promise.resolve(),
  ]).catch(() => {});

  res.json({
    ...updated,
    userName: submitter?.name ?? null,
    assignedToName: staff.name,
  });
});

export default router;
