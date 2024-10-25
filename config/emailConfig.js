import nodemailer from 'nodemailer';

const createTransporter = async () => {
  // Create transporter using Gmail OAuth2
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: process.env.GOOGLE_ACCESS_TOKEN
    }
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return transporter;
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    throw error;
  }
};

export default createTransporter;

// 2. Update your registration route (users.js)
import createTransporter from '../config/emailConfig.js';

router.post('/register', registerValidator, async (req, res, next) => {  
  const { username, email, password } = req.body;  
  
  try {  
    // Check if user exists
    const existingUser = await User.findOne({ email });  
    if (existingUser) {  
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });  
    }  

    // Generate email verification token
    const emailToken = crypto.randomBytes(64).toString("hex");
    
    // Create new user
    const user = new User({ 
      username, 
      email, 
      password, 
      emailToken,
      isVerified: false 
    });  
    
    await user.save();  

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailToken}`;
    
    try {
      // Get email transporter
      const transporter = await createTransporter();
      
      // Send verification email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Fitness Tracker',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Welcome to Fitness Tracker!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        `
      });

      res.status(201).json({ 
        success: true,
        message: 'Registration successful! Please check your email to verify your account.' 
      });
      
    } catch (emailError) {
      // If email sending fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send verification email. Please try again.' 
      });
    }
    
  } catch (err) {  
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during registration.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }  
});