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

// Multer configuration remains the same
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

dotenv.config();
const router = express.Router();

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

// Registration route with verification code
router.post('/register', registerValidator, async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60000);

    const user = new User({
      username,
      email,
      password,
      verificationCode,
      verificationCodeExpires
    });

    await user.save();

    await transporter.sendMail({
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h2>Welcome to Our Platform!</h2>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 30 minutes.</p>
        <p>Please enter this code in the verification page to complete your registration.</p>
      `
    });

    res.status(201).json({
      msg: 'Registration successful! Please check your email for the verification code.',
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if already verified
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

    // Update user verification status
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

 
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification.'
    });
  }
});

// Resend verification code
router.post('/resend-verification-code', async (req, res) => {
  try {
    const { userId } = req.body;

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
      subject: 'New Verification Code',
      html: `
        <h2>New Verification Code</h2>
        <p>Your new verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 30 minutes.</p>
      `
    });

    res.json({ message: 'New verification code sent successfully' });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: 'Error resending verification code' });
  }
});

// Login route
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

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        return next(err);
      }
      res.json({ token });
    });
  } catch (err) {
    next(err);
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


// Fetch user profile
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

// Update user profile
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

    console.log('Image uploaded to:', result.secure_url);

    req.user.profileImage = result.secure_url;
    await req.user.save();

    res.json({ url: req.user.profileImage });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    next(error);
  }
});

router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login/failed' }),
  async (req, res) => {
    try {
      // Create JWT token after successful Google authentication
      const payload = { user: { id: req.user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);



router.get('/login/failed', (req, res) => {
  res.status(401).json({
    error: true,
    message: 'Login failure',
  });
});


router.get('/login/success', (req, res) => {
  res.status(200).json({
    error: false,
    message: 'Login success',
    user: req.user, // Send user info
  });
});


const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An error occurred!', error: err.message });
};


// const verifyEmail = async (req, res) => {
//   try {
//     const emailToken = res.body.emailToken
//     if (!emailToken) return res.status(404).json('EmailToken not found...')
//       const user = await User.findOne({ emailToken })

//     if (user) {
//       user.emailToken = null,
//       user.isVerified = true,
//       await user.save()

//       const token = createToken(user._id)

//       res.status(200).json({
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         token,
//         isVerified: user?.isVerified
//       })

//     } else res.status(404).json("Email verification failed, invalid token!")

//     } catch (error) {
//       console.log(error)
//       res.status(500).json(error.message)
//     }
// }



router.use(errorHandler);

export default router;
