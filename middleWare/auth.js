import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  let token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    token = req.cookies?.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).lean();

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { password, ...restUser } = user;
    req.user = { ...restUser, id: restUser._id };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        console.error("Authentication error:", err);
        return res.status(401).json({ error: "Token expired. Please log in again." });
      }

      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);

        if (!user || user.refreshToken !== refreshToken) {
          return res.status(401).json({ error: "Invalid refresh token" });
        }

        const payload = { user: { id: user.id } };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const { password, ...restUser } = user.toObject();
        req.user = { ...restUser, id: restUser._id };

        next();
      } catch (refreshErr) {
        console.error("Refresh token error:", refreshErr);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }
    } else {
      console.error("Authentication error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
  }
};

export default auth;
