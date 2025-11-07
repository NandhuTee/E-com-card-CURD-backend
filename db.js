// db.js - simple sqlite wrapper
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, 'ecom.db');

const db = new sqlite3.Database(dbFile);

function init() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL,
        description TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS cart (
        productId TEXT PRIMARY KEY,
        qty INTEGER,
        name TEXT,
        price REAL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        total REAL,
        timestamp TEXT,
        items TEXT
      )
    `);
  });
}

module.exports = { db, init };
