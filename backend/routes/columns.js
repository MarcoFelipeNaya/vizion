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

    // Single JOIN query instead of N+1 — fetches all columns and their cards at once
    const [rows] = await pool.query(`
      SELECT
        col.id          AS col_id,
        col.title       AS col_title,
        col.position    AS col_position,
        col.board_id    AS col_board_id,
        c.id            AS card_id,
        c.title         AS card_title,
        c.description   AS card_description,
        c.color         AS card_color,
        c.position      AS card_position,
        c.column_id     AS card_column_id
      FROM columns col
      LEFT JOIN cards c ON c.column_id = col.id
      WHERE col.board_id = ?
      ORDER BY col.position ASC, c.position ASC
    `, [boardId]);

    // Group flat rows into nested { column: { cards: [] } } structure
    const columnsMap = new Map();
    for (const row of rows) {
      if (!columnsMap.has(row.col_id)) {
        columnsMap.set(row.col_id, {
          id:       row.col_id,
          title:    row.col_title,
          position: row.col_position,
          board_id: row.col_board_id,
          cards:    []
        });
      }
      if (row.card_id) {
        columnsMap.get(row.col_id).cards.push({
          id:          row.card_id,
          title:       row.card_title,
          description: row.card_description,
          color:       row.card_color,
          position:    row.card_position,
          column_id:   row.card_column_id
        });
      }
    }

    res.json([...columnsMap.values()]);
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

// PUT /api/columns/reorder — update positions of all columns in one transaction
router.put('/reorder', async (req, res) => {
  const { orderedIds } = req.body; // array of column ids in new order

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await Promise.all(
      orderedIds.map((id, index) =>
        conn.query('UPDATE columns SET position = ? WHERE id = ?', [index, id])
      )
    );
    await conn.commit();
    res.json({ message: 'Columns reordered' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
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