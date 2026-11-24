import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication is required." });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload.sub !== "string") {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}
