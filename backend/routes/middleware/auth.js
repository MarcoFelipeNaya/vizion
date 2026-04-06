const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// this function runs before any protected route
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // extract token from "Bearer <token>"

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to request object
    next(); // allow request to continue to the route handler
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;