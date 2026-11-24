import { Router } from "express";
import Contact from "../models/Contact.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { csvUpload } from "../middleware/upload.js";
import { contactsToCsv, parseContactsCsv } from "../utils/csvContacts.js";

const router = Router();
const VIEWS = new Set(["all", "favorites", "followups", "trash"]);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DUPLICATE = "An active contact with this email already exists.";

router.post(
  "/import",
  requireAuth,
  csvUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'Attach a CSV file in the "file" field.');

    const { total, valid, errors } = parseContactsCsv(req.file.buffer);

    const emails = valid.map((row) => row.values.email).filter(Boolean);
    const existing = new Set(
      emails.length
        ? await Contact.find({ owner: req.user.id, deletedAt: null, email: { $in: emails } }).distinct("email")
        : [],
    );

    let imported = 0;
    for (const row of valid) {
      if (row.values.email && existing.has(row.values.email)) {
        errors.push({ line: row.line, name: row.values.name, message: DUPLICATE });
        continue;
      }
      try {
        await Contact.create({ ...row.values, owner: req.user.id });
        imported += 1;
      } catch (error) {
        const message =
          error.code === 11000
            ? DUPLICATE
            : error.name === "ValidationError"
              ? Object.values(error.errors)[0]?.message
              : "This row could not be saved.";
        errors.push({ line: row.line, name: row.values.name, message });
      }
    }

    errors.sort((a, b) => a.line - b.line);
    return res.status(imported > 0 ? 201 : 200).json({
      success: true,
      message: `Imported ${imported} of ${total} rows.`,
      total,
      imported,
      failed: errors.length,
      errors,
    });
  }),
);

// GET /api/contacts/export?view=all|favorites|followups|trash&search=&tag=
router.get(
    "/export",
    requireAuth,
    asyncHandler(async (req, res) => {
      const view = typeof req.query.view === "string" ? req.query.view : "all";
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
      if (!VIEWS.has(view)) throw httpError(400, "view must be all, favorites, followups or trash.");
      if (search.length > 100 || tag.length > 40) throw httpError(400, "Search text is too long.");
  
      // Filtering happens in the database query, not in JavaScript.
      const filter = { owner: req.user.id, deletedAt: view === "trash" ? { $ne: null } : null };
      if (view === "favorites") filter.favorite = true;
      if (view === "followups") {
        const weekAhead = new Date();
        weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);
        filter.followUp = { $ne: null, $lte: weekAhead };
      }
      if (tag) filter.tags = tag;
      if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = ["name", "email", "phone", "company", "role", "tags"].map((field) => ({ [field]: pattern }));
      }
  
      const contacts = await Contact.find(filter).sort({ name: 1 }).lean();
      const date = new Date().toISOString().slice(0, 10);
      res.set("Content-Type", "text/csv; charset=utf-8");
      res.attachment(`contactx-${view}-${date}.csv`);
      return res.send(contactsToCsv(contacts));
    }),
  );

export default router;