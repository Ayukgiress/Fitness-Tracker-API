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
import nodemailer from 'nodemailer';
import passport from 'passport';

dotenv.config();

const router = express.Router();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Multer configuration
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

// ==================== REGISTRATION ROUTE ====================
router.post('/register', registerValidator, async (req, res, next) => {
  const { username, email, password, weight } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60000); // 30 minutes

    const user = new User({
      username,
      email,
      password,
      weight,
      verificationCode,
      verificationCodeExpires,
      isVerified: false
    });

    await user.save();

    await transporter.sendMail({
      to: email,
      subject: 'Verify Your Email - FitTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Welcome to FitTrack!</h2>
          <p>Thank you for registering. Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #ef4444; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          </div>
          <p>This code will expire in <strong>30 minutes</strong>.</p>
          <p>Please enter this code in the verification page to complete your registration.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(201).json({
      success: true,
      msg: 'Registration successful! Please check your email for the verification code.',
      userId: user._id
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ==================== VERIFY EMAIL ROUTE ====================
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required.'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified.'
      });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.'
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification.'
    });
  }
});

// ==================== VERIFY EMAIL CODE ====================
router.post('/verify-email-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required.'
      });
    }

    const user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() },
      isVerified: false
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification code.'
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification.'
    });
  }
});

// ==================== RESEND VERIFICATION CODE ====================
router.post('/resend-verification-code', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await transporter.sendMail({
      to: user.email,
      subject: 'New Verification Code - FitTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">New Verification Code</h2>
          <p>You requested a new verification code:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #ef4444; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          </div>
          <p>This code will expire in <strong>30 minutes</strong>.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'New verification code sent successfully'
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: 'Error resending verification code' });
  }
});

// ==================== LOGIN ROUTE ====================
router.post('/login', loginValidator, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const payload = { user: { id: user.id } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({ 
      success: true,
      accessToken, 
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
});

// ==================== GET CURRENT USER ====================
router.get("/current-user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken')
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

// ==================== GET USER PROFILE ====================
router.get("/profile", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ==================== UPDATE USER PROFILE ====================
router.put('/profile', auth, async (req, res, next) => {
  const { username, email, profileImage } = req.body;

  try {
    // Check if email is being changed and already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, profileImage },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// ==================== UPDATE WEIGHT ====================
router.put('/update-weight', auth, async (req, res, next) => {
  const { weight } = req.body;

  if (!weight || weight <= 0) {
    return res.status(400).json({ error: 'Valid weight is required' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { weight },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// ==================== UPLOAD PROFILE IMAGE ====================
router.post('/uploadProfileImage', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const result = await uploadToCloudService(filePath);

    console.log('Image uploaded to:', result.secure_url);

    const user = await User.findById(req.user.id);
    user.profileImage = result.secure_url;
    await user.save();

    res.json({ 
      success: true,
      url: user.profileImage 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    next(error);
  }
});

// ==================== GOOGLE AUTH ====================
router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login/failed' }),
  async (req, res) => {
    try {
      const payload = { user: { id: req.user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Check if user needs to provide weight (new Google OAuth users won't have weight)
      if (!req.user.weight) {
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&missingWeight=true`);
      } else {
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

router.get('/login/failed', (req, res) => {
  res.status(401).json({
    error: true,
    message: 'Google authentication failed',
  });
});

router.get('/login/success', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: 'Not authenticated'
    });
  }

  res.status(200).json({
    error: false,
    message: 'Login successful',
    user: req.user,
  });
});

// ==================== ERROR HANDLER ====================
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  
  res.status(500).json({ 
    message: 'An error occurred!', 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
};

router.use(errorHandler);

export default router;