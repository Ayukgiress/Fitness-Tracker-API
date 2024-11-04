import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id); // Remove .lean()

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Ensure to omit the password field
    const { password, ...restUser } = user.toObject(); // Convert to a plain object
    req.user = { ...restUser, id: restUser._id };

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default auth;
