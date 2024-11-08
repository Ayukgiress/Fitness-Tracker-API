import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from './models/user.js'; 

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://fitness-tracker-api-backends.onrender.com/users/auth/google/callback",
},
async (accessToken, refreshToken, profile, done) => {
  console.log(profile); 
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
}));

passport.serializeUser((user, done) => {
  done(null, user.id); 
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


