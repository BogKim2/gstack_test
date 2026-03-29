const Database = require("better-sqlite3");
const db = new Database("./data/db.sqlite");

console.log("Running migration 3...");

try {
  db.exec(`
    ALTER TABLE briefing ADD COLUMN warnings TEXT;
  `);
  console.log("Migration 3 completed!");
} catch (e) {
  if (String(e.message || e).includes("duplicate column")) {
    console.log("Column warnings already exists, skipping.");
  } else {
    throw e;
  }
}

db.close();
