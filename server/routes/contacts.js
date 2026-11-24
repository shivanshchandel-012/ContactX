import { Router } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
const editableFields = [
  "name",
  "email",
  "phone",
  "company",
  "role",
  "tags",
  "followUp",
  "favorite",
  "lastContact",
  "color",
];
const textFields = new Set(["name", "email", "phone", "company", "role", "lastContact", "color"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidFollowUp(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseContactBody(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Request body must be a JSON object.");
  }

  if (!partial && (typeof body.name !== "string" || !body.name.trim())) {
    throw httpError(400, "Contact name is required.");
  }

  const values = {};
  for (const field of editableFields) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];

    if (textFields.has(field)) {
      if (typeof value !== "string") throw httpError(400, `${field} must be a string.`);
      const trimmed = value.trim();
      if (field === "email" && trimmed && !emailPattern.test(trimmed)) {
        throw httpError(400, "Enter a valid email address.");
      }
      values[field] = field === "email" && !trimmed ? undefined : trimmed;
    } else if (field === "tags") {
      if (!Array.isArray(value) || value.length > 20 || value.some((tag) => typeof tag !== "string")) {
        throw httpError(400, "Tags must be an array of at most 20 strings.");
      }
      values.tags = value.map((tag) => tag.trim()).filter(Boolean);
    } else if (field === "followUp") {
      if (value === "" || value === null) {
        values.followUp = null;
      } else if (!isValidFollowUp(value)) {
        throw httpError(400, "Follow-up must be a valid date.");
      } else {
        values.followUp = value;
      }
    } else if (field === "favorite") {
      if (typeof value !== "boolean") throw httpError(400, "favorite must be a boolean.");
      values.favorite = value;
    }
  }

  return values;
}

function isValidContactId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid contact ID.");
}

async function ensureEmailIsAvailable(owner, email, excludedId) {
  if (!email) return;
  const query = { owner, email: email.toLowerCase(), deletedAt: null };
  if (excludedId) query._id = { $ne: excludedId };
  if (await Contact.exists(query)) {
    throw httpError(409, "An active contact with this email already exists.");
  }
}

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const contacts = await Contact.find({ owner: req.user.id, deletedAt: null }).sort({ updatedAt: -1 });
    return res.json({ success: true, contacts });
  }),
);

router.get(
  "/trash",
  asyncHandler(async (req, res) => {
    const contacts = await Contact.find({
      owner: req.user.id,
      deletedAt: { $ne: null },
    }).sort({ deletedAt: -1 });
    return res.json({ success: true, contacts });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const values = parseContactBody(req.body);
    await ensureEmailIsAvailable(req.user.id, values.email);
    const contact = await Contact.create({ ...values, owner: req.user.id });
    return res.status(201).json({ success: true, contact });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    isValidContactId(req.params.id);
    const contact = await Contact.findOne({
      _id: req.params.id,
      owner: req.user.id,
      deletedAt: null,
    });
    if (!contact) throw httpError(404, "Contact not found.");
    return res.json({ success: true, contact });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    isValidContactId(req.params.id);
    const values = parseContactBody(req.body, true);
    if (Object.keys(values).length === 0) {
      throw httpError(400, "Provide at least one contact field to update.");
    }
    const contact = await Contact.findOne({
      _id: req.params.id,
      owner: req.user.id,
      deletedAt: null,
    });
    if (!contact) throw httpError(404, "Contact not found.");
    if (Object.hasOwn(values, "email")) {
      await ensureEmailIsAvailable(req.user.id, values.email, contact.id);
    }
    Object.assign(contact, values);
    await contact.save();
    return res.json({ success: true, contact });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    isValidContactId(req.params.id);
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!contact) throw httpError(404, "Contact not found.");
    return res.json({ success: true, contact });
  }),
);

router.patch(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    isValidContactId(req.params.id);
    const contact = await Contact.findOne({
      _id: req.params.id,
      owner: req.user.id,
      deletedAt: { $ne: null },
    });
    if (!contact) throw httpError(404, "Deleted contact not found.");
    await ensureEmailIsAvailable(req.user.id, contact.email, contact.id);
    contact.deletedAt = null;
    await contact.save();
    return res.json({ success: true, contact });
  }),
);

export default router;
