// dbConfig.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path (stored in project folder)
const dbPath = path.resolve(__dirname, "database.sqlite");

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at", dbPath);
  }
});

// Create Users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error("❌ Error creating users table:", err.message);
  else console.log("✅ Users table ready");
});

// Create Tasks table
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_h TEXT NOT NULL,
    task_desc TEXT,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("❌ Error creating tasks table:", err.message);
  else console.log("✅ Tasks table ready");
});

module.exports = db;
