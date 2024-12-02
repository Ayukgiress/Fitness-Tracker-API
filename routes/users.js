import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenv from 'dotenv';
import registerValidator from '../utils/registerValidator.js';
import loginValidator from '../utils/loginValidator.js';
import auth from '../middleWare/auth.js';
import { uploadToCloudService } from '../cloudService.js';
import multer from 'multer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';

dotenv.config();
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

router.post('/register', registerValidator, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 3600000;

    const user = new User({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: 'Email Verification',
      html: `<h2>Email Verification</h2>
             <p>Please click the link below to verify your email:</p>
             <p><a href="${verificationUrl}">Verify Email</a></p>`
    });

    res.status(201).json({
      msg: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token: jwtToken,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during verification.',
    });
  }
});

router.post('/resend-verification-code', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 3600000;
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: 'Email Verification',
      html: `<h2>Email Verification</h2>
             <p>Please click the link below to verify your email:</p>
             <p><a href="${verificationUrl}">Verify Email</a></p>`
    });

    res.json({ message: 'New verification email sent successfully' });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: 'Error resending verification code' });
  }
});

router.post('/login', loginValidator, async (req, res, next) => {
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
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ msg: 'Refresh token required' });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ msg: 'Invalid refresh token' });
      }

      const payload = { user: { id: decoded.user.id } };
      const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7h' });

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get("/current-user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/profile", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', auth, async (req, res, next) => {
  const { username, email, profileImage } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.post('/uploadProfileImage', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const result = await uploadToCloudService(filePath);

    if (!req.user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileImage = result.secure_url;
    await user.save();

    res.json({ url: user.profileImage });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    next(error);
  }
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  (req, res, next) => {
    console.log('Callback hit:', req.query); 
    next(); 
  },
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login`, session: false }),
  async (req, res) => {
    const token = jwt.sign({ user: { id: req.user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

export default router;
