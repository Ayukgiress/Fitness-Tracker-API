import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from './models/user.js'; 
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google Client ID and Secret must be set in .env');
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `https://fitness-tracker-api-backends.onrender.com/auth/google/callback`,
  passRequestToCallback: true,
  scope: ["profile", "email"]
}, 
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("GOOGLE PROFILE", JSON.stringify(profile, null, 2));
    
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        profileImage: profile.photos[0]?.value || 'default-image-url.jpg',
      });
      await user.save();
    }
    return done(null, user);

  } catch (error) {
    console.error('Error during Google authentication:', error);
    return done(error, false);  
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error, null);
  }
});

export default passport;