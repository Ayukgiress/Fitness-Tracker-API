import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import dotenv from 'dotenv';
import registerValidator from '../utils/registerValidator.js';
import loginValidator from '../utils/loginValidator.js';

dotenv.config();

const router = express.Router();

// Registration route
router.post('/register', registerValidator, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user
    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10), // Hash password
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign the JWT
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login route
router.post('/login', loginValidator, async (req, res) => {
  console.log("Request Body:", req.body);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log("User found:", user); // Check if user is found

    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    console.log("Password match:", isMatch); // Check if passwords match

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});



export default router;
