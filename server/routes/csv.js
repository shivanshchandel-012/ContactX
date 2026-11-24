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


export default router;