
import { Router } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import FollowUp from "../models/FollowUp.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

async function getOwnedContact(contactId, owner) {
  if (!mongoose.isValidObjectId(contactId)) {
    throw httpError(400, "Invalid contact ID.");
  }

  const contact = await Contact.findOne({
    _id: contactId,
    owner,
    deletedAt: null,
  });

  if (!contact) {
    throw httpError(404, "Contact not found.");
  }

  return contact;
}

// List follow-up tasks
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        (page - 1) * limit > Number.MAX_SAFE_INTEGER
    ) {
      throw httpError(400, "Invalid pagination values.");
    }

    const activeContactIds = await Contact.distinct("_id", {
    owner: req.user.id,
    deletedAt: null,
    });

    const filter = {
    owner: req.user.id,
    contact: { $in: activeContactIds },
    };

    if (req.query.completed !== undefined) {
      if (!["true", "false"].includes(req.query.completed)) {
        throw httpError(400, "completed must be true or false.");
      }

      filter.completed = req.query.completed === "true";
    }

    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate("contact", "name email company")
        .sort({ dueAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      FollowUp.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      followUps,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),
);

// Create a follow-up task
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw httpError(400, "A valid request body is required.");
    }
    const { contactId, title, description = "", dueAt } = req.body;

    await getOwnedContact(contactId, req.user.id);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120
    ) {
      throw httpError(400, "A valid follow-up title is required.");
    }

    if (
      typeof description !== "string" ||
      description.length > 2000
    ) {
      throw httpError(400, "Description must be at most 2000 characters.");
    }

    const isValidDateFormat =
    typeof dueAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dueAt);

    const parsedDueAt = isValidDateFormat
    ? new Date(`${dueAt}T00:00:00.000Z`)
    : null;

    if (
    !parsedDueAt ||
    Number.isNaN(parsedDueAt.getTime()) ||
    parsedDueAt.toISOString().slice(0, 10) !== dueAt
    ) {
    throw httpError(400, "A valid due date in YYYY-MM-DD format is required.");
    }

    const followUp = await FollowUp.create({
      owner: req.user.id,
      contact: contactId,
      title: title.trim(),
      description: description.trim(),
      dueAt: parsedDueAt,
    });

    return res.status(201).json({
      success: true,
      followUp,
    });
  }),
);

// Complete or reopen a follow-up task
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw httpError(400, "A valid request body is required.");
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, "Invalid follow-up ID.");
    }

    if (
      typeof req.body.completed !== "boolean"
    ) {
      throw httpError(400, "completed must be a boolean.");
    }

    const followUp = await FollowUp.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!followUp) {
      throw httpError(404, "Follow-up not found.");
    }

    followUp.completed = req.body.completed;
    followUp.completedAt = req.body.completed ? new Date() : null;

    await followUp.save();

    return res.json({
      success: true,
      followUp,
    });
  }),
);

// Delete a follow-up task
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, "Invalid follow-up ID.");
    }

    const followUp = await FollowUp.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!followUp) {
      throw httpError(404, "Follow-up not found.");
    }

    return res.json({ success: true, message: "Follow-up deleted." });
  }),
);

export default router;
