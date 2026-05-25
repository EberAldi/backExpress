import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Cliente");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. ¿Ya tiene cuenta vinculada con Google?
        let cliente = await repo().findOne({
          where: { googleId: profile.id, isActive: true },
        });
        if (cliente) return done(null, cliente);

        // 2. ¿Existe por email? → vincular
        const email = profile.emails?.[0]?.value ?? null;
        if (email) {
          cliente = await repo().findOne({ where: { email, isActive: true } });
          if (cliente) {
            cliente.googleId = profile.id;
            cliente.avatar = profile.photos?.[0]?.value ?? cliente.avatar;
            await repo().save(cliente);
            return done(null, cliente);
          }
        }

        // 3. Cliente nuevo
        const nuevo = repo().create({
          nombre: profile.displayName,
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value ?? null,
        });
        await repo().save(nuevo);
        return done(null, nuevo);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
