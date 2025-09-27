require("dotenv").config();
const authSecret = process.env.authSecret;
const passport = require("passport");
const passportJWT = require("passport-jwt");
const { Strategy, ExtractJwt } = passportJWT;

module.exports = (app) => {
  const params = {
    secretOrKey: authSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  };

  const strategy = new Strategy(params, (payload, done) => {
    app
      .db("users")
      .where({ id: payload.id })
      .first()
      .then((user) => {
        if (user) {
          done(null, { id: user.id, name: user.name, email: user.email });
        } else {
          done(null, false);
        }
      })
      .catch((err) => done(err, false));
  });

  passport.use(strategy);

  return {
    initialize: () => passport.initialize(),
    authenticate: () => passport.authenticate("jwt", { session: false }),
  };
};
