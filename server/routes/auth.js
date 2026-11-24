import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler, httpError } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      throw httpError(400, "Name must be between 2 and 80 characters.");
    }
    if (typeof email !== "string" || !emailPattern.test(email.trim())) {
      throw httpError(400, "Enter a valid email address.");
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      throw httpError(400, "Password must be between 8 and 128 characters.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      throw httpError(409, "An account with this email address already exists.");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    });
    const safeUser = publicUser(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: createToken(safeUser.id),
      user: safeUser,
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || !emailPattern.test(email.trim())) {
      throw httpError(400, "Enter a valid email address.");
    }
    if (typeof password !== "string" || password.length === 0 || password.length > 128) {
      throw httpError(400, "Enter a valid password.");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw httpError(401, "Invalid email or password.");
    }

    const safeUser = publicUser(user);
    return res.json({
      success: true,
      message: "Logged in successfully.",
      token: createToken(safeUser.id),
      user: safeUser,
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, "User not found.");
    return res.json({ success: true, user: publicUser(user) });
  }),
);

export default router;
