const Database = require('better-sqlite3');
const db = new Database('./data/db.sqlite');

console.log('Running migration...');

db.exec(`
  ALTER TABLE briefing ADD COLUMN llmProvider TEXT;
  ALTER TABLE briefing ADD COLUMN llmModel TEXT;
  ALTER TABLE briefing ADD COLUMN llmEndpoint TEXT;
`);

console.log('Migration completed!');
db.close();
