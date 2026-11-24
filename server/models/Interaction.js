import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["call", "email", "meeting", "message", "note"],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

interactionSchema.index(
  { owner: 1, contact: 1, occurredAt: -1 },
  { name: "owner_contact_interaction_history" },
);

interactionSchema.index(
  { owner: 1, occurredAt: -1 },
  { name: "owner_interaction_timeline" },
);

export default mongoose.models.Interaction ||
  mongoose.model("Interaction", interactionSchema);
