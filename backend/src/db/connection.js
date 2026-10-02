const path = require('path');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

// Determine database path relative to project structure
const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(__dirname, '../../', process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../../../database/pharmacy.db');

// Initialize database instance
const db = new Database(dbPath, {
  // verbose: console.log // uncomment for debugging SQL queries if needed
});

// Enforce foreign key constraints and use Write-Ahead Logging (WAL) for safe concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

module.exports = db;
