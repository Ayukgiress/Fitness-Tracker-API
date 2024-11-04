router.post('/email-verification', async (req, res) => {
  const { action, userId, email, code } = req.body;

  try {
    if (action === 'register') {
      // Handle registration
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 30 * 60000);

      const user = new User({
        email,
        verificationCode,
        verificationCodeExpires,
      });

      await user.save();

      await transporter.sendMail({
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
      });

      return res.status(201).json({
        msg: 'Registration successful! Please check your email for the verification code.',
        userId: user._id,
      });
    } else if (action === 'verify') {
      // Handle email verification
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (!user.isVerificationCodeValid()) {
        return res.status(400).json({
          success: false,
          message: 'Verification code is invalid or expired. Please request a new one.',
        });
      }

      if (user.verificationCode !== code) {
        await user.incrementVerificationAttempts();
        return res.status(400).json({ success: false, message: 'Invalid verification code.' });
      }

      user.isVerified = true;
      await user.clearVerificationData();
      await user.save();

      return res.status(200).json({ success: true, message: 'Email verified successfully!' });
    } else if (action === 'resend') {
      // Handle resending the verification code
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
        html: `<p>Your new verification code is: <strong>${verificationCode}</strong></p>`,
      });

      return res.json({ message: 'New verification code sent successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid action specified' });
    }
  } catch (error) {
    console.error('Error in email verification route:', error);
    return res.status(500).json({ message: 'An error occurred during the process.' });
  }
});
