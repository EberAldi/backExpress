// src/auth/google.strategy.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AppDataSource } from "../data-source.js";  // tu DataSource

const userRepo = () => AppDataSource.getRepository("User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const repo = userRepo();

        // 1. ¿Ya existe por googleId?
        let user = await repo.findOne({
          where: { googleId: profile.id },
        });

        if (user) return done(null, user);

        // 2. ¿Existe por email? (alguien que ya tenía cuenta normal)
        const email = profile.emails[0].value;
        user = await repo.findOne({ where: { email } });

        if (user) {
          // Vincular cuenta existente con Google
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value ?? null;
          await repo.save(user);
          return done(null, user);
        }

        // 3. Crear usuario nuevo
        const newUser = repo.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value ?? null,
          password: null,
        });

        await repo.save(newUser);
        return done(null, newUser);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;