const express = require('express');
const cors = require('cors');
require('dotenv').config();

const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const cardRoutes = require('./routes/cards');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://vizion-theta.vercel.app' 
  ]
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Vizion is running!' });
});

app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vizion running on http://localhost:${PORT}`);
});