import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Contact name is required."],
      trim: true,
      minlength: [1, "Contact name cannot be empty."],
      maxlength: [120, "Contact name must be at most 120 characters long."],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      maxlength: [254, "Email must be at most 254 characters long."],
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid email address.",
      },
    },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    company: { type: String, trim: true, maxlength: 120, default: "" },
    role: { type: String, trim: true, maxlength: 120, default: "" },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: [(tags) => tags.length <= 20, "A contact can have at most 20 tags."],
    },
    followUp: { type: Date, default: null },
    favorite: { type: Boolean, default: false },
    lastContact: { type: String, trim: true, maxlength: 80, default: "" },
    color: { type: String, trim: true, maxlength: 30, default: "blue" },
    photoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    photoPublicId: { type: String, trim: true, maxlength: 300, default: "" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

contactSchema.index(
  { owner: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" }, deletedAt: null },
    name: "unique_active_contact_email_per_owner",
  },
);

contactSchema.set("toJSON", {
  transform: (_document, value) => {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    delete value.owner;
    delete value.photoPublicId;
    if (value.followUp) value.followUp = value.followUp.toISOString().slice(0, 10);
    return value;
  },
});

export default mongoose.models.Contact || mongoose.model("Contact", contactSchema);
