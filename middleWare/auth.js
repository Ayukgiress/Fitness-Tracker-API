import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Received Token:", token); 
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);  
  
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
  
    req.user = { ...user.toObject(), id: user._id };
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ error: "Invalid token", details: err.message });
  }
  
};

export default auth;
