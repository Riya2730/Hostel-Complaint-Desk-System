import { Router, type IRouter } from "express";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateComplaintBody,
  UpdateComplaintBody,
  GetComplaintParams,
  UpdateComplaintParams,
  GetComplaintsQueryParams,
} from "@workspace/api-zod";
import { verifyJWT, authorizeRole } from "../middlewares/auth";
import { analyzeComplaint } from "../lib/ai";

const router: IRouter = Router();

router.get("/complaints/stats", verifyJWT, authorizeRole("admin", "staff"), async (req, res): Promise<void> => {
  const all = await db.select().from(complaintsTable);
  const total = all.length;
  const pending = all.filter((c) => c.status === "pending").length;
  const inProgress = all.filter((c) => c.status === "in_progress").length;
  const resolved = all.filter((c) => c.status === "resolved").length;

  const categoryMap: Record<string, number> = {};
  const priorityMap: Record<string, number> = {};
  for (const c of all) {
    categoryMap[c.categoryUser] = (categoryMap[c.categoryUser] ?? 0) + 1;
    if (c.priority) {
      priorityMap[c.priority] = (priorityMap[c.priority] ?? 0) + 1;
    }
  }

  res.json({
    total,
    pending,
    inProgress,
    resolved,
    byCategory: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
    byPriority: Object.entries(priorityMap).map(([priority, count]) => ({ priority, count })),
  });
});

router.get("/complaints", verifyJWT, async (req, res): Promise<void> => {
  const params = GetComplaintsQueryParams.safeParse(req.query);
  const user = req.user!;

  let complaintsWithUsers;

  if (user.role === "student") {
    complaintsWithUsers = await db
      .select({
        id: complaintsTable.id,
        title: complaintsTable.title,
        description: complaintsTable.description,
        categoryUser: complaintsTable.categoryUser,
        categoryAi: complaintsTable.categoryAi,
        priority: complaintsTable.priority,
        sentiment: complaintsTable.sentiment,
        status: complaintsTable.status,
        imageUrl: complaintsTable.imageUrl,
        location: complaintsTable.location,
        feedback: complaintsTable.feedback,
        feedbackRating: complaintsTable.feedbackRating,
        userId: complaintsTable.userId,
        assignedTo: complaintsTable.assignedTo,
        createdAt: complaintsTable.createdAt,
        updatedAt: complaintsTable.updatedAt,
        userName: usersTable.name,
      })
      .from(complaintsTable)
      .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
      .where(eq(complaintsTable.userId, user.userId));
  } else if (user.role === "staff") {
    complaintsWithUsers = await db
      .select({
        id: complaintsTable.id,
        title: complaintsTable.title,
        description: complaintsTable.description,
        categoryUser: complaintsTable.categoryUser,
        categoryAi: complaintsTable.categoryAi,
        priority: complaintsTable.priority,
        sentiment: complaintsTable.sentiment,
        status: complaintsTable.status,
        imageUrl: complaintsTable.imageUrl,
        location: complaintsTable.location,
        feedback: complaintsTable.feedback,
        feedbackRating: complaintsTable.feedbackRating,
        userId: complaintsTable.userId,
        assignedTo: complaintsTable.assignedTo,
        createdAt: complaintsTable.createdAt,
        updatedAt: complaintsTable.updatedAt,
        userName: usersTable.name,
      })
      .from(complaintsTable)
      .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
      .where(eq(complaintsTable.assignedTo, user.userId));
  } else {
    complaintsWithUsers = await db
      .select({
        id: complaintsTable.id,
        title: complaintsTable.title,
        description: complaintsTable.description,
        categoryUser: complaintsTable.categoryUser,
        categoryAi: complaintsTable.categoryAi,
        priority: complaintsTable.priority,
        sentiment: complaintsTable.sentiment,
        status: complaintsTable.status,
        imageUrl: complaintsTable.imageUrl,
        location: complaintsTable.location,
        feedback: complaintsTable.feedback,
        feedbackRating: complaintsTable.feedbackRating,
        userId: complaintsTable.userId,
        assignedTo: complaintsTable.assignedTo,
        createdAt: complaintsTable.createdAt,
        updatedAt: complaintsTable.updatedAt,
        userName: usersTable.name,
      })
      .from(complaintsTable)
      .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id));
  }

  const result = complaintsWithUsers.map((c) => ({
    ...c,
    assignedToName: null as string | null,
  }));

  res.json(result);
});

router.post("/complaints", verifyJWT, authorizeRole("student"), async (req, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, categoryUser, location, imageUrl } = parsed.data;

  const [complaint] = await db
    .insert(complaintsTable)
    .values({
      title,
      description,
      categoryUser,
      location,
      imageUrl: imageUrl ?? null,
      userId: req.user!.userId,
    })
    .returning();

  if (!complaint) {
    res.status(500).json({ error: "Failed to create complaint" });
    return;
  }

  analyzeComplaint(title, description).then(async (analysis) => {
    await db
      .update(complaintsTable)
      .set({
        categoryAi: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
      })
      .where(eq(complaintsTable.id, complaint.id));
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(201).json({
    ...complaint,
    userName: user?.name ?? null,
    assignedToName: null,
  });
});

router.get("/complaints/:id", verifyJWT, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const user = req.user!;
  if (user.role === "student" && complaint.userId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (user.role === "staff" && complaint.assignedTo !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, complaint.userId));
  let assignedToName: string | null = null;
  if (complaint.assignedTo) {
    const [assignee] = await db.select().from(usersTable).where(eq(usersTable.id, complaint.assignedTo));
    assignedToName = assignee?.name ?? null;
  }

  res.json({
    ...complaint,
    userName: submitter?.name ?? null,
    assignedToName,
  });
});

router.put("/complaints/:id", verifyJWT, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid complaint ID" });
    return;
  }

  const parsed = UpdateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const user = req.user!;
  const { status, feedback, feedbackRating } = parsed.data;

  if (user.role === "student") {
    if (feedback == null && feedbackRating == null) {
      res.status(403).json({ error: "Students can only submit feedback" });
      return;
    }
    if (existing.userId !== user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(complaintsTable)
      .set({ feedback: feedback ?? undefined, feedbackRating: feedbackRating ?? undefined })
      .where(eq(complaintsTable.id, id))
      .returning();
    const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    res.json({ ...updated, userName: submitter?.name ?? null, assignedToName: null });
    return;
  }

  if (user.role === "staff") {
    if (existing.assignedTo !== user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(complaintsTable)
      .set({ status: (status as "pending" | "in_progress" | "resolved") ?? undefined })
      .where(eq(complaintsTable.id, id))
      .returning();
    const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    res.json({ ...updated, userName: submitter?.name ?? null, assignedToName: null });
    return;
  }

  const updateData: Partial<typeof existing> = {};
  if (status) updateData.status = status as "pending" | "in_progress" | "resolved";
  if (feedback != null) updateData.feedback = feedback;
  if (feedbackRating != null) updateData.feedbackRating = feedbackRating;

  const [updated] = await db
    .update(complaintsTable)
    .set(updateData)
    .where(eq(complaintsTable.id, id))
    .returning();

  const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
  res.json({ ...updated, userName: submitter?.name ?? null, assignedToName: null });
});

export default router;
