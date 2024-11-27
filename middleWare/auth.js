import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    console.log("Received Token:", token); 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { password, ...restUser } = user.toObject();
    req.user = { ...restUser, id: restUser._id };

    next();
  } catch (err) {
    console.error("Authentication error:", err); 
    return res.status(401).json({ error: "Invalid token", details: err.message });
  }
};


export default auth;
