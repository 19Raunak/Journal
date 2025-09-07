const express = require('express');
const app = express();
<<<<<<< HEAD
const db = require("./dbConfig");
console.log("DB type:", typeof db, db.constructor.name);
const PORT = process.env.PORT || 3000;
=======
const db = require("./dbConfig"); // updated for sqlite3
>>>>>>> Switched from better-sqlit3 to sqlite3
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const initializePassport = require("./passportConfig");
const path = require('path');

initializePassport(passport);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ------------------ ROUTES ------------------

// Homepage
app.get('/', (req, res) => res.render("index"));

// Register
app.get("/users/register", checkAuthenticated, (req, res) => res.render("register"));

// Login
app.get("/users/login", checkAuthenticated, (req, res) => res.render("login"));

// Dashboard
app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, tasks) => {
    if (err) {
      console.error("Error fetching tasks:", err.message);
      return res.render("dashboard", { user: req.user.name, tasks: [] });
    }
    res.render("dashboard", { user: req.user.name, tasks });
  });
});

// Todo page
app.get("/users/todo", checkNotAuthenticated, (req, res) => {
  db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, tasks) => {
    if (err) {
      console.error("Error fetching tasks:", err.message);
      return res.render("todo", { user: req.user.name, tasks: [] });
    }
    res.render("todo", { user: req.user.name, tasks });
  });
});

// Logout
app.get("/users/logout", (req, res, next) => {
  req.logOut(function (err) {
    if (err) return next(err);
    req.flash("success_msg", "You have logged out");
    res.redirect("/users/login");
  });
});

// ------------------ REGISTER ------------------
app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) errors.push({ message: "Please enter all details" });
  if (password.length < 6) errors.push({ message: "Password should be at least 6 characters" });
  if (password !== password2) errors.push({ message: "Passwords do not match" });

  if (errors.length > 0) return res.render("register", { errors });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error("Error checking user:", err.message);
      return res.render("register", { errors: [{ message: "Database error" }] });
    }
    if (user) {
      return res.render("register", { errors: [{ message: "Email already registered!" }] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          console.error("Error inserting user:", err.message);
          return res.render("register", { errors: [{ message: "Database error" }] });
        }
        req.flash("success_msg", "You are now registered. Please log in.");
        res.redirect("/users/login");
      }
    );
  });
});

// ------------------ LOGIN ------------------
app.post("/users/login", passport.authenticate("local", {
  successRedirect: "/users/dashboard",
  failureRedirect: "/users/login",
  failureFlash: true
}));

// ------------------ ADD TODO ------------------
app.post("/users/todo", checkNotAuthenticated, (req, res) => {
  const { task_h, task_desc } = req.body;
  db.run("INSERT INTO tasks (user_id, task_h, task_desc) VALUES (?, ?, ?)",
    [req.user.id, task_h, task_desc],
    function (err) {
      if (err) {
        console.error("Error inserting task:", err.message);
      }
      res.redirect("/users/todo");
    }
  );
});

// ------------------ COMPLETE TASK ------------------
app.post("/users/todo/complete/:id", checkNotAuthenticated, (req, res) => {
  const taskId = req.params.id;
  db.run("UPDATE tasks SET completed = 1 WHERE id = ? AND user_id = ?",
    [taskId, req.user.id],
    function (err) {
      if (err) {
        console.error("Error marking task complete:", err.message);
      }
      res.redirect("/users/dashboard");
    }
  );
});

// ------------------ AUTH MIDDLEWARE ------------------
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect("/users/dashboard");
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/users/login");
}

<<<<<<< HEAD
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
=======
// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
>>>>>>> Switched from better-sqlit3 to sqlite3
