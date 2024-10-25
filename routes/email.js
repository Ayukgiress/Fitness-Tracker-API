
// Email verification route
router.get('/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const user = await User.findOne({ emailToken: token });
  
      if (!user) {
        return res.status(404).json({ msg: 'Invalid token or user not found.' });
      }
  
      // Verify the user
      user.isVerified = true;
      user.emailToken = null; // Clear the token
      await user.save();
  
      // Redirect to the dashboard or send a success message
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`); // Change to your dashboard route
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ msg: 'An error occurred during verification.' });
    }
  });
  export default router  