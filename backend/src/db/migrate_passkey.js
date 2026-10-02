const db = require('./connection');

try {
  db.exec('ALTER TABLE users ADD COLUMN passkey TEXT DEFAULT "1111";');
  console.log('✅ Added passkey column to users table');
} catch (e) {
  console.log('ℹ️ passkey column already exists in users table');
}

db.prepare('UPDATE users SET passkey = ? WHERE username = ?').run('2306324052', 'admin');
db.prepare('UPDATE users SET passkey = ? WHERE username = ?').run('1111', 'cashier01');
db.prepare('UPDATE users SET passkey = ? WHERE username = ?').run('2222', 'cashier02');

const users = db.prepare('SELECT id, username, role, full_name, passkey FROM users').all();
console.log('✅ Updated users with passkeys:');
console.table(users);
