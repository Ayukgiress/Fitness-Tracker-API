
import express from 'express';  
import jwt from 'jsonwebtoken';  
import User from '../models/user.js';  
import dotenv from 'dotenv';  
import registerValidator from '../utils/registerValidator.js';  
import loginValidator from '../utils/loginValidator.js';  
import auth from '../middleWare/auth.js';
import { uploadToCloudService } from '../cloudService.js';  
import multer from 'multer';

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

const errorHandler = (err, req, res, next) => {
  console.error(err.message);  
  res.status(500).json({ msg: 'Server error', error: err.message });
};

// Registration route
router.post('/register', registerValidator, async (req, res, next) => {  
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
        return next(err);
      }  
      res.json({ token });  
    });  
  } catch (err) {  
    next(err);  
  }  
});  

// Login route
router.post('/login', loginValidator, async (req, res, next) => {  
  const { email, password } = req.body;  
  console.log("Login attempt:", { email });

  try {  
    const user = await User.findOne({ email });  
    if (!user) {  
      console.log("User not found");
      return res.status(400).json({ msg: 'Invalid email or password' });  
    }  

    console.log("User found, checking password...");
    const isMatch = await user.matchPassword(password);  
    if (!isMatch) {  
      console.log("Password mismatch");
      return res.status(400).json({ msg: 'Invalid email or password' });  
    }  

    const payload = { user: { id: user.id } };  

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {  
      if (err) {  
        console.error("JWT signing error:", err);
        return next(err);  
      }  
      res.json({ token });  
    });  
  } catch (err) {  
    console.error("Login error:", err);  
    next(err);  
  }  
});

router.get("/current-user", auth, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.json(error);
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

    // Check if the upload was successful and log the URL
    console.log('Image uploaded to:', result.secure_url);

    req.user.profileImage = result.secure_url; 
    await req.user.save();

    res.json({ url: req.user.profileImage }); 
  } catch (error) {
    console.error('Error uploading profile image:', error);
    next(error);
  }
});



router.use(errorHandler);

export default router;
