import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from './models/user.js'; 

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}users/auth/google/callback`
}, 
async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      const newUser = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        profileImage: profile.photos[0]?.value,
      });
      await newUser.save();
      return done(null, newUser); 
    }

    return done(null, user);

  } catch (error) {
    console.error(error);
    return done(error, false);  
  }
}
));


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


