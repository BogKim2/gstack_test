const Database = require('better-sqlite3');
const db = new Database('./data/db.sqlite');

console.log('Running migration 2...');

db.exec(`
  ALTER TABLE briefing ADD COLUMN meetingContexts TEXT;
`);

console.log('Migration 2 completed!');
db.close();
