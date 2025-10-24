const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  // Get token from header (check both x-auth-token and Authorization header)
  const token = req.header('x-auth-token') || 
                (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded;
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};