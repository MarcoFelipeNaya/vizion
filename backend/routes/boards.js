const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('./middleware/auth');

// protect all board routes
router.use(authMiddleware);

// GET /api/boards — get only the logged in user's boards
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id] // req.user comes from authMiddleware
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/boards — create a board for the logged in user
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO boards (title, user_id) VALUES (?, ?)',
      [title, req.user.id] // attach board to logged in user
    );
    res.status(201).json({ id: result.insertId, title, user_id: req.user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/boards/:id — only delete if board belongs to user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM boards WHERE id = ? AND user_id = ?',
      [id, req.user.id] // extra check — can't delete someone else's board
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;