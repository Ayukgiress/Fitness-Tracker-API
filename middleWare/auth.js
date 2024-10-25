import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  console.log(token);

  try {
    const decoded = (() => {
      try {
        return jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return null;
      }
    })();

    if (!decoded) {
      return next();
    }
    const user = await User.findById(decoded.user.id).lean();

    if (!user) {
      next();
      // return res.status(401).json({ error: 'User not found' });
    }

    const { password, ...restUser } = user;
    req.user = { ...restUser, id: restUser._id };

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default auth;
