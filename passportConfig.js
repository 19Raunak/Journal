// passportConfig.js
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const db = require("./dbConfig");

function initialize(passport) {
  const authenticateUser = (email, password, done) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

      if (!user) {
        return done(null, false, { message: "Email is not registered." });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Password is not correct." });
        }
      });
    } catch (err) {
      return done(err);
    }
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });
}

module.exports = initialize;
