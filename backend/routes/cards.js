const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('./middleware/auth');

// protect all card routes
router.use(authMiddleware);

// POST /api/cards — create a new card
router.post('/', async (req, res) => {
  const { column_id, title, description, color } = req.body;

  if (!column_id || !title) {
    return res.status(400).json({ error: 'column_id and title are required' });
  }

  try {
    // put new card at the end of the column
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE column_id = ?',
      [column_id]
    );
    const position = rows[0].count;

    const [result] = await pool.query(
      'INSERT INTO cards (column_id, title, description, position, color) VALUES (?, ?, ?, ?, ?)',
      [column_id, title, description || null, position, color || '#8b5cf6']
    );

    res.status(201).json({
      id: result.insertId,
      column_id,
      title,
      description: description || null,
      position,
      color: color || '#8b5cf6'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cards/:id — update a card title, description or color
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, color } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE cards SET title = ?, description = ?, color = ? WHERE id = ?',
      [title, description || null, color || '#8b5cf6', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ id, title, description, color });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cards/:id/move — move a card to a different column
router.put('/:id/move', async (req, res) => {
  const { id } = req.params;
  const { column_id, position } = req.body;

  if (!column_id === undefined || position === undefined) {
    return res.status(400).json({ error: 'column_id and position are required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE cards SET column_id = ?, position = ? WHERE id = ?',
      [column_id, position, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ id, column_id, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cards/:id — delete a card
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM cards WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;