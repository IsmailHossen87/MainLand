import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import { User } from '../modules/user/user.model';
import passport from 'passport';
import config from '../../config';
import { USER_ROLES } from '../../enums/user';
import crypto from 'crypto';

// Google er jonno
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID!,
      clientSecret: config.GOOGLE_CLIENT_SECRET!,
      callbackURL: config.GOOGLE_CALLBACK_URL!},
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(null, false, { message: 'No email found ' });
        }
        let isUserExites = await User.findOne({ email });

        if (isUserExites && !isUserExites.verified) {
          return done(null, false, { message: 'User is not verified' });
        }
        if (isUserExites && isUserExites.status === 'Blocked') {
          return done(null, false, {
            message: `User is ${isUserExites.status}`,
          });
        }

        if (!isUserExites) {
          isUserExites = await User.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: USER_ROLES.USER,
            verified: true,
            password: crypto.randomBytes(20).toString('hex'),
            auths: [
              {
                provider: 'google',
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, isUserExites);
      } catch (error) {
        console.log('Google Strategy Error', error);
        return done(error);
      }
    }
  )
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
