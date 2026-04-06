const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('./middleware/auth');

// protect all column routes
router.use(authMiddleware);

// GET /api/columns/:boardId — get columns only if board belongs to user
router.get('/:boardId', async (req, res) => {
  const { boardId } = req.params;

  try {
    // verify board belongs to user first
    const [boards] = await pool.query(
      'SELECT id FROM boards WHERE id = ? AND user_id = ?',
      [boardId, req.user.id]
    );

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const [columns] = await pool.query(
      'SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC',
      [boardId]
    );

    for (const column of columns) {
      const [cards] = await pool.query(
        'SELECT * FROM cards WHERE column_id = ? ORDER BY position ASC',
        [column.id]
      );
      column.cards = cards;
    }

    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/columns — create column (verify board ownership)
router.post('/', async (req, res) => {
  const { board_id, title } = req.body;

  if (!board_id || !title) {
    return res.status(400).json({ error: 'board_id and title are required' });
  }

  try {
    // verify board belongs to user
    const [boards] = await pool.query(
      'SELECT id FROM boards WHERE id = ? AND user_id = ?',
      [board_id, req.user.id]
    );

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM columns WHERE board_id = ?',
      [board_id]
    );
    const position = rows[0].count;

    const [result] = await pool.query(
      'INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)',
      [board_id, title, position]
    );

    res.status(201).json({ id: result.insertId, board_id, title, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/columns/:id — update column
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;

  if (title === undefined && position === undefined) {
    return res.status(400).json({ error: 'title or position is required' });
  }

  try {
    if (title !== undefined) {
      await pool.query('UPDATE columns SET title = ? WHERE id = ?', [title, id]);
    }
    if (position !== undefined) {
      await pool.query('UPDATE columns SET position = ? WHERE id = ?', [position, id]);
    }

    const [rows] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/columns/:id — delete column
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM columns WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }

    res.json({ message: 'Column deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;