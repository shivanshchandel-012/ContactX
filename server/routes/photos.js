import { Router } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { photoUpload } from "../middleware/upload.js";
import {
  deleteContactPhoto,
  isCloudinaryConfigured,
  uploadContactPhoto,
} from "../config/cloudinary.js";

const router = Router();

// POST /api/contacts/:id/photo  (multipart/form-data, field name "photo")
router.post(
  "/:id/photo",
  requireAuth,
  photoUpload,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid contact ID.");
    if (!req.file) throw httpError(400, 'Attach an image in the "photo" field.');
    if (!isCloudinaryConfigured()) throw httpError(503, "Photo storage is not configured on the server.");

    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user.id, deletedAt: null });
    if (!contact) throw httpError(404, "Contact not found.");

    let result;
    try {
      result = await uploadContactPhoto(req.file.buffer, req.user.id);
    } catch (error) {
      console.error("Cloudinary upload failed:", error.message);
      throw httpError(502, "The photo could not be uploaded. Please try again.");
    }

    const oldPublicId = contact.photoPublicId;
    contact.photoUrl = result.secure_url;
    contact.photoPublicId = result.public_id;
    await contact.save();

    // Remove the replaced photo; a failure here should not fail the request.
    deleteContactPhoto(oldPublicId).catch((error) =>
      console.error("Old photo could not be deleted:", error.message),
    );

    return res.json({ success: true, contact });
  }),
);

export default router;