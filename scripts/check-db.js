const Database = require('better-sqlite3');
const db = new Database('./data/db.sqlite');

console.log('\n=== Users Table ===');
const users = db.prepare('SELECT * FROM user').all();
console.log(users);

console.log('\n=== Accounts Table ===');
const accounts = db.prepare('SELECT userId, provider, providerAccountId FROM account').all();
console.log(accounts);

console.log('\n=== Briefings Table ===');
const briefings = db.prepare('SELECT * FROM briefing').all();
console.log(briefings);

db.close();
