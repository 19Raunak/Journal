const express = require('express');
const app = express();
const db = require("./dbConfig");
console.log("DB type:", typeof db, db.constructor.name);
const PORT = process.env.PORT || 4000;
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

// Routes
app.get('/', (req, res) => res.render("index"));

app.get("/users/register", checkAuthenticated, (req, res) => res.render("register"));

app.get("/users/login", checkAuthenticated, (req, res) => res.render("login"));

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
    let tasks = [];

    try {
        tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
                  .all(req.user.id);
    } catch (err) {
        console.error("Error fetching tasks:", err.message);
        tasks = [];
    }

    res.render("dashboard", { user: req.user.name, tasks });
});


app.get("/users/todo", checkNotAuthenticated, (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.render("todo", { user: req.user.name, tasks });
});

app.get("/users/logout", (req, res, next) => {
    req.logOut(function(err) {
        if(err) return next(err);
        req.flash("success_msg", "You have logged out");
        res.redirect("/users/login");
    });
});

// Register
app.post("/users/register", async (req, res) => {
    let { name, email, password, password2 } = req.body;
    let errors = [];

    if(!name || !email || !password || !password2) errors.push({message: "Please enter all details"});
    if(password.length < 6) errors.push({message: "Password should be at least 6 characters"});
    if(password !== password2) errors.push({message: "Passwords do not match"});

    if(errors.length > 0) return res.render("register", { errors });

    // Check if user exists
    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if(existingUser){
        errors.push({ message: "Email already registered!" });
        return res.render("register", { errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);

    req.flash("success_msg", "You are now registered. Please log in.");
    res.redirect("/users/login");
});

// Login
app.post("/users/login", passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
}));

// Add todo task
app.post("/users/todo", checkNotAuthenticated, (req, res) => {
    const { task_h, task_desc } = req.body;
    db.prepare("INSERT INTO tasks (user_id, task_h, task_desc) VALUES (?, ?, ?)")
      .run(req.user.id, task_h, task_desc);
    res.redirect("/users/todo");
});

// Mark task as completed
app.post("/users/todo/complete/:id", checkNotAuthenticated, (req, res) => {
  const taskId = req.params.id;
  db.prepare("UPDATE tasks SET completed = 1 WHERE id = ? AND user_id = ?")
    .run(taskId, req.user.id);
  res.redirect("/users/dashboard");
});


// Auth middleware
function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()) return res.redirect("/users/dashboard");
    next();
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect("/users/login");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
