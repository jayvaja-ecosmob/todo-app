require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDB, pool } = require('./db');
const taskRoutes = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Improved health check (checks DB too)
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

app.use('/api/tasks', taskRoutes);

async function start() {
  await initDB();
  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});