const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10; // how many times bcrypt hashes the password

// POST /api/auth/register — create a new account
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // hash the password — never store plain text
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // create the user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // create a token immediately so user is logged in after register
    const token = jwt.sign(
      { id: result.insertId, email },
      JWT_SECRET,
      { expiresIn: '7d' } // token expires in 7 days
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, name, email }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login — login with email + password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // find user by email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // compare password with stored hash
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me — get current logged in user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;