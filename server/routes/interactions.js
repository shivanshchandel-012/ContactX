import { Router } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import Interaction from "../models/Interaction.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const allowedTypes = [
  "call",
  "email",
  "meeting",
  "message",
  "note",
];

router.use(requireAuth);


router.param("contactId", async (req, res, next, contactId) => {
  try {
    if (!mongoose.isValidObjectId(contactId)) {
      throw httpError(400, "Invalid contact ID.");
    }

    const contact = await Contact.findOne({
      _id: contactId,
      owner: req.user.id,
      deletedAt: null,
    });

    if (!contact) {
      throw httpError(404, "Contact not found.");
    }

    req.contact = contact;
    next();
  } catch (error) {
    next(error);
  }
});


// Get interaction history for a contact
router.get(
  "/:contactId/interactions",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw httpError(400, "Invalid pagination values.");
    }

    const filter = {
      owner: req.user.id,
      contact: req.contact._id,
    };

    const [interactions, total] = await Promise.all([
      Interaction.find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Interaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      interactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),
);

// Record a new interaction
router.post(
  "/:contactId/interactions",
  asyncHandler(async (req, res) => {
    const { type, title, description = "", occurredAt } = req.body;

    if (!allowedTypes.includes(type)) {
      throw httpError(400, "Invalid interaction type.");
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120
    ) {
      throw httpError(400, "A valid interaction title is required.");
    }

    if (
      typeof description !== "string" ||
      description.length > 2000
    ) {
      throw httpError(400, "Description must be at most 2000 characters.");
    }

    const date = occurredAt === undefined
      ? new Date()
      : new Date(occurredAt);

    if (
      occurredAt !== undefined &&
      (typeof occurredAt !== "string" || Number.isNaN(date.getTime()))
    ) {
      throw httpError(400, "Invalid interaction date.");
    }

    const interaction = await Interaction.create({
      owner: req.user.id,
      contact: req.contact._id,
      type,
      title: title.trim(),
      description: description.trim(),
      occurredAt: date,
    });

    return res.status(201).json({
      success: true,
      interaction,
    });
  }),
);

export default router;
