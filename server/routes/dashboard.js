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
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const activeContacts = {
      owner,
      deletedAt: null,
    };
    const activeContactIds = await Contact.distinct("_id", activeContacts);

    const [
      totalContacts,
      favoriteContacts,
      addedThisMonth,
      upcomingFollowUps,
      overdueFollowUps,
      dueFollowUps,
      recentInteractions,
    ] =
      await Promise.all([
        Contact.countDocuments(activeContacts),

        Contact.countDocuments({
          ...activeContacts,
          favorite: true,
        }),

        Contact.countDocuments({
          ...activeContacts,
          createdAt: { $gte: monthStart },
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

        Contact.countDocuments({
          ...activeContacts,
          followUp: { $ne: null, $lt: tomorrow },
        }),

        Interaction.find({
          owner,
          contact: { $in: activeContactIds },
        })
          .sort({ occurredAt: -1 })
          .limit(5)
          .populate("contact", "name email"),
      ]);

    return res.json({
      success: true,
      summary: {
        totalContacts,
        favoriteContacts,
        addedThisMonth,
        upcomingFollowUps,
        overdueFollowUps,
        dueFollowUps,
        recentInteractions,
      },
    });
  }),
);

export default router;