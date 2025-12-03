// server/src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Better: full URL so it matches Google Console
        callbackURL:
          `${process.env.SERVER_BASE_URL || "http://localhost:8080"}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        // We just pass the Google profile forward.
        // DB logic (upsert user, generate token) is in authService.loginWithGoogle
        return done(null, profile);
      }
    )
  );

  // These are mostly for session-based auth; harmless even if you're using JWT
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj as any);
  });
};

// 🔴 IMPORTANT: call it here so that just importing this file configures passport
configurePassport();

export default passport;
