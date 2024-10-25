import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from './models/user.js'; // Adjust the path as needed

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/users/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
      });

      await newUser.save();
      done(null, newUser);
    } catch (error) {
      console.error('Error during user creation:', error);
      done(error, null);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id); // or user._id
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


export default passport;


