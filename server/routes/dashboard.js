
import { Router } from "express";
import Contact from "../models/Contact.js";
import FollowUp from "../models/FollowUp.js";
import Interaction from "../models/Interaction.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const owner = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeContacts = {
      owner,
      deletedAt: null,
    };
    const activeContactIds = await Contact.distinct("_id", activeContacts);

    const [totalContacts, favoriteContacts, upcomingFollowUps, overdueFollowUps, recentInteractions] =
      await Promise.all([
        Contact.countDocuments(activeContacts),

        Contact.countDocuments({
          ...activeContacts,
          favorite: true,
        }),

        FollowUp.countDocuments({
          owner,
          contact: { $in: activeContactIds },
          completed: false,
          dueAt: { $gte: today },
        }),

        FollowUp.countDocuments({
          owner,
          contact: { $in: activeContactIds },
          completed: false,
          dueAt: { $lt: today },
        }),

        Interaction.find({ owner })
          .sort({ occurredAt: -1 })
          .limit(5)
          .populate("contact", "name email"),
      ]);

    return res.json({
      success: true,
      summary: {
        totalContacts,
        favoriteContacts,
        upcomingFollowUps,
        overdueFollowUps,
        recentInteractions,
      },
    });
  }),
);

export default router;