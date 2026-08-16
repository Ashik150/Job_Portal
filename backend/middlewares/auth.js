import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

// ─── OPTIMIZATION: In-memory user cache ────────────────────────────────────────
// Before: User.findById(decoded.id) runs on EVERY authenticated request → 15ms × n reqs
// After:  Cache stores decoded user by token — only 1 DB call per unique token (TTL: 5min)
const _userCache = new Map();
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const cached = _userCache.get(token);
  if (cached && Date.now() - cached.ts < USER_CACHE_TTL_MS) {
    req.user = cached.user; // Cache hit — no DB call
    return next();
  }

  // Cache miss — fetch from DB and cache the result
  const user = await User.findById(decoded.id);
  _userCache.set(token, { user, ts: Date.now() });
  req.user = user;
  next();
});
