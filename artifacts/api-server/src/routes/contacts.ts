import { Router, type IRouter } from "express";
import { db, contactsTable } from "@workspace/db";
import { CreateContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db
    .insert(contactsTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })
    .returning();

  res.status(201).json({
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? null,
    subject: inquiry.subject,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
  });
});

export default router;
