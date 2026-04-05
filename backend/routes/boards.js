const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/boards — get all boards
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM boards ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/boards — create a new board
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO boards (title) VALUES (?)',
      [title]
    );
    res.status(201).json({ id: result.insertId, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/boards/:id — delete a board
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM boards WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;