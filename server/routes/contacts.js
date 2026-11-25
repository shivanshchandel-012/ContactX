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

export function parseContactBody(body, partial = false) {
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInt(value, fallback, max = Infinity) {
  if (value === undefined) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw httpError(400, "Pagination values must be positive integers.");
  }

  return Math.min(parsed, max);
}

function addTextFilters(filter, query) {
  if (query.search) {
    const search = escapeRegex(String(query.search).trim());
    if (search) {
      filter.$or = ["name", "email", "company", "phone", "role", "tags"].map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }
  }

  if (query.company) {
    filter.company = {
      $regex: `^${escapeRegex(String(query.company).trim())}$`,
      $options: "i",
    };
  }

  if (query.tag) {
    filter.tags = String(query.tag).trim();
  }
}

const allowedSortFields = new Set([
  "name",
  "createdAt",
  "updatedAt",
  "followUp",
]);

router.use(requireAuth);


router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;

    const sortBy = String(req.query.sortBy || "updatedAt").split(",");
    const order = req.query.order || "desc";

    if (
      sortBy.length > 3 ||
      new Set(sortBy).size !== sortBy.length ||
      sortBy.some((field) => !allowedSortFields.has(field))
    ) {
      throw httpError(400, "Invalid sort field.");
    }

    if (!["asc", "desc"].includes(order)) {
      throw httpError(400, "Sort order must be asc or desc.");
    }

    const filter = {
      owner: req.user.id,
      deletedAt: null,
    };

    addTextFilters(filter, req.query);

    if (req.query.favorite !== undefined) {
      if (!["true", "false"].includes(req.query.favorite)) {
        throw httpError(400, "favorite must be true or false.");
      }

      filter.favorite = req.query.favorite === "true";
    }

    if (req.query.followUpDays !== undefined) {
      const days = parsePositiveInt(req.query.followUpDays, 7, 365);
      const throughDate = new Date();
      throughDate.setUTCHours(23, 59, 59, 999);
      throughDate.setUTCDate(throughDate.getUTCDate() + days);
      filter.followUp = { $ne: null, $lte: throughDate };
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({
          ...Object.fromEntries(sortBy.map((field) => [field, order === "asc" ? 1 : -1])),
          _id: 1,
        })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + contacts.length < total,
        hasPrevPage: page > 1,
      },
    });
  }),
);


router.get(
  "/trash",
  asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;
    const sortBy = String(req.query.sortBy || "updatedAt").split(",");
    const order = req.query.order || "desc";

    if (
      sortBy.length > 3 ||
      new Set(sortBy).size !== sortBy.length ||
      sortBy.some((field) => !allowedSortFields.has(field))
    ) {
      throw httpError(400, "Invalid sort field.");
    }
    if (!["asc", "desc"].includes(order)) {
      throw httpError(400, "Sort order must be asc or desc.");
    }

    const filter = {
      owner: req.user.id,
      deletedAt: { $ne: null },
    };
    addTextFilters(filter, req.query);

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({
          ...Object.fromEntries(sortBy.map((field) => [field, order === "asc" ? 1 : -1])),
          _id: 1,
        })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + contacts.length < total,
        hasPrevPage: page > 1,
      },
    });
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
  "/favorites",
  asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;

    const filter = {
      owner: req.user.id,
      deletedAt: null,
      favorite: true,
    };

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),
);

router.get(
  "/follow-ups",
  asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const filter = {
      owner: req.user.id,
      deletedAt: null,
      followUp: { $ne: null },
    };

    if (req.query.status === "overdue") {
      filter.followUp.$lt = today;
    } else if (req.query.status === "upcoming") {
      filter.followUp.$gte = today;
    } else if (req.query.status !== undefined && req.query.status !== "all") {
      throw httpError(400, "Status must be overdue, upcoming or all.");
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ followUp: 1 })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
