// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host:     process.env.DB_HOST     || 'localhost',
//   port:     parseInt(process.env.DB_PORT || '3306'),
//   user:     process.env.DB_USER     || 'todo_user',
//   password: process.env.DB_PASSWORD || 'todo_pass',
//   database: process.env.DB_NAME     || 'todo_db',
//   waitForConnections: true,
//   connectionLimit:    10,
//   queueLimit:         0,
// });

// async function initDB() {
//   const conn = await pool.getConnection();
//   try {
//     await conn.execute(`
//       CREATE TABLE IF NOT EXISTS tasks (
//         id          INT AUTO_INCREMENT PRIMARY KEY,
//         text        VARCHAR(500)                           NOT NULL,
//         done        TINYINT(1)                             NOT NULL DEFAULT 0,
//         priority    ENUM('none','low','medium','high')     NOT NULL DEFAULT 'none',
//         created_at  DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
//         updated_at  DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP
//                       ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
//     `);
//     console.log('Database initialised — tasks table ready');
//   } finally {
//     conn.release();
//   }
// }

// module.exports = { pool, initDB };


const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'todo_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

async function initDB() {
  const conn = await pool.getConnection();
  try {
    // Ensure DB exists (IMPORTANT)
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'todo_db'}\`;`);
    await conn.query(`USE \`${process.env.DB_NAME || 'todo_db'}\`;`);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        text        VARCHAR(500) NOT NULL,
        done        TINYINT(1)   NOT NULL DEFAULT 0,
        priority    ENUM('none','low','medium','high') NOT NULL DEFAULT 'none',
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Database initialised — tasks table ready');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDB };