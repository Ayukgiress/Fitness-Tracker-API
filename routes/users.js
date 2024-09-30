import express from 'express';  
import jwt from 'jsonwebtoken';  
import User from '../models/user.js';  
import dotenv from 'dotenv';  
import registerValidator from '../utils/registerValidator.js';  
import loginValidator from '../utils/loginValidator.js';  

dotenv.config();  
const router = express.Router();  

// Registration route  
router.post('/register', registerValidator, async (req, res) => {  
  const { username, email, password } = req.body;  
  console.log("Registration Attempt:", { username, email });  

  try {  
    const existingUser = await User.findOne({ email });  
    if (existingUser) {  
      return res.status(400).json({ msg: 'User already exists' });  
    }  

    const user = new User({ username, email, password });  
    await user.save();  
    console.log("User Created:", user);  

    const payload = { user: { id: user.id } };  

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {  
      if (err) {  
        console.error("JWT signing error:", err);  
        return res.status(500).json({ msg: 'Server error' });  
      }  
      res.json({ token });  
    });  
  } catch (err) {  
    console.error("Registration Error:", err.message);  
    res.status(500).json({ msg: 'Server error' });  
  }  
});  

// Login route  
router.post('/login', loginValidator, async (req, res) => {  
  console.log("Request Body:", req.body);  

  const { email, password } = req.body;  

  try {  
      const user = await User.findOne({ email });  
      if (!user) {  
          return res.status(400).json({ msg: 'Invalid email or password' });  
      }  

      const isMatch = await user.matchPassword(password);  
      if (!isMatch) {  
          return res.status(400).json({ msg: 'Invalid email or password' });  
      }  

      const payload = { user: { id: user.id } };  

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {  
        if (err) {  
          console.error("JWT signing error:", err);  
          return res.status(500).json({ msg: 'Server error' });  
        }  
        res.json({ token });  
      });  
  } catch (err) {  
    console.error("Login Error:", err.message);  
    res.status(500).json({ msg: 'Server error' });  
  }  
});  

export default router;