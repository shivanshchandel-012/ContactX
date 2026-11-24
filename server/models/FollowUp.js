
import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    dueAt: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

followUpSchema.index(
  { owner: 1, completed: 1, dueAt: 1 },
  { name: "owner_followup_tasks_due" },
);

followUpSchema.index(
  { owner: 1, contact: 1, dueAt: 1 },
  { name: "owner_contact_followup_tasks" },
);

export default mongoose.models.FollowUp ||
  mongoose.model("FollowUp", followUpSchema);
