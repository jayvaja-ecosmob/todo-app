// const express = require('express');
// const { pool } = require('../db');
// const router = express.Router();

// // GET /api/tasks  — list all tasks (optional ?filter=active|done|high)
// router.get('/', async (req, res) => {
//   try {
//     const { filter } = req.query;
//     let sql = 'SELECT * FROM tasks';
//     const params = [];

//     if (filter === 'active') { sql += ' WHERE done = 0'; }
//     else if (filter === 'done')   { sql += ' WHERE done = 1'; }
//     else if (filter === 'high')   { sql += " WHERE priority = 'high'"; }

//     sql += ' ORDER BY created_at DESC';
//     const [rows] = await pool.execute(sql, params);
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch tasks' });
//   }
// });

// // POST /api/tasks  — create a task
// router.post('/', async (req, res) => {
//   try {
//     const { text, priority = 'none' } = req.body;
//     if (!text || !text.trim()) {
//       return res.status(400).json({ error: 'text is required' });
//     }
//     const [result] = await pool.execute(
//       "INSERT INTO tasks (text, priority) VALUES (?, ?)",
//       [text.trim(), priority]
//     );
//     const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
//     res.status(201).json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to create task' });
//   }
// });

// // PUT /api/tasks/:id  — update text, done, or priority
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { text, done, priority } = req.body;

//     const sets = [];
//     const params = [];
//     if (text     !== undefined) { sets.push('text = ?');     params.push(text.trim()); }
//     if (done     !== undefined) { sets.push('done = ?');     params.push(done ? 1 : 0); }
//     if (priority !== undefined) { sets.push('priority = ?'); params.push(priority); }

//     if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

//     params.push(id);
//     await pool.execute(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);

//     const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
//     if (!rows.length) return res.status(404).json({ error: 'Task not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to update task' });
//   }
// });

// // DELETE /api/tasks/:id  — delete one task
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
//     if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
//     res.json({ message: 'Task deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to delete task' });
//   }
// });

// // DELETE /api/tasks  — bulk delete all completed tasks
// router.delete('/', async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM tasks WHERE done = 1');
//     res.json({ message: 'Completed tasks cleared' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to clear tasks' });
//   }
// });

// module.exports = router;

const express = require('express');
const { pool } = require('../db');
const router = express.Router();

const ALLOWED_PRIORITIES = ['none', 'low', 'medium', 'high'];

// GET tasks
router.get('/', async (req, res) => {
  try {
    const { filter } = req.query;
    let sql = 'SELECT * FROM tasks';

    if (filter === 'active') sql += ' WHERE done = 0';
    else if (filter === 'done') sql += ' WHERE done = 1';
    else if (filter === 'high') sql += " WHERE priority = 'high'";

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// CREATE task
router.post('/', async (req, res) => {
  try {
    let { text, priority = 'none' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    text = text.trim();

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const [result] = await pool.execute(
      "INSERT INTO tasks (text, priority) VALUES (?, ?)",
      [text, priority]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// UPDATE task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { text, done, priority } = req.body;

    const sets = [];
    const params = [];

    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({ error: 'text cannot be empty' });
      }
      sets.push('text = ?');
      params.push(text.trim());
    }

    if (done !== undefined) {
      sets.push('done = ?');
      params.push(done ? 1 : 0);
    }

    if (priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }
      sets.push('priority = ?');
      params.push(priority);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE single task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// DELETE completed tasks
router.delete('/', async (_req, res) => {
  try {
    await pool.execute('DELETE FROM tasks WHERE done = 1');
    res.json({ message: 'Completed tasks cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear tasks' });
  }
});

module.exports = router;