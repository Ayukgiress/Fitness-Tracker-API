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


router.post('/register', registerValidator, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    res.status(201).json({
      msg: 'Registration successful! You can now log in.',
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});



// router.post('/verify-email', async (req, res) => {
//   try {
//     const { userId, code } = req.body;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found.'
//       });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already verified.'
//       });
//     }


//     if (user.verificationCodeExpires < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Verification code has expired. Please request a new one.'
//       });
//     }


//     if (user.verificationCode !== code) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid verification code.'
//       });
//     }

//     user.isVerified = true;
//     user.verificationCode = null;
//     user.verificationCodeExpires = null;
//     await user.save();


//     const payload = { user: { id: user.id } };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

//     return res.status(200).json({
//       success: true,
//       message: 'Email verified successfully!',
//       token
//     });

//   } catch (error) {
//     console.error('Verification error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred during verification.'
//     });
//   }
// });

// Resend verification code
// router.post('/resend-verification-code', async (req, res) => {
//   try {
//     const { userId } = req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: 'Email is already verified' });
//     }

//     const verificationCode = generateVerificationCode();
//     const verificationCodeExpires = new Date(Date.now() + 30 * 60000);

//     user.verificationCode = verificationCode;
//     user.verificationCodeExpires = verificationCodeExpires;
//     await user.save();

//     await transporter.sendMail({
//       to: user.email,
//       subject: 'New Verification Code',
//       html: `
//         <h2>New Verification Code</h2>
//         <p>Your new verification code is: <strong>${verificationCode}</strong></p>
//         <p>This code will expire in 30 minutes.</p>
//       `
//     });

//     res.json({ message: 'New verification code sent successfully' });
//   } catch (error) {
//     console.error('Error resending verification code:', error);
//     res.status(500).json({ message: 'Error resending verification code' });
//   }
// });

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

    console.log('Image uploaded to:', result.secure_url);

    if (!req.user) {
      return res.status(400).json({ message: 'User not found.' });
    }

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
      const user = req.user;

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

      const frontendUrl = `https://fittrack-web.vercel.app/auth/callback?token=${token}`;

      console.log(`Redirecting to: ${frontendUrl}`);

      res.redirect(frontendUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`https://fittrack-web.vercel.app/login?error=auth_failed`);
    }
  }
);






router.get('/login/failed', (req, res) => {
  res.status(401).json({
    error: true,
    message: 'Login failure',
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


router.post('/reset-password-request', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email with reset link
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>
      `
    });

    res.json({ msg: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Route to reset the password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Token must be valid
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // Hash the new password and update it
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined; // Remove reset token
    user.resetPasswordExpires = undefined; // Remove expiration
    await user.save();

    res.json({ msg: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});



router.use(errorHandler);

export default router;
