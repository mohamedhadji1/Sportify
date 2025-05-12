require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
// console.log('DEBUG: backend/index.js - About to require ./routes/auth'); // Removed debug log
const authRoutes = require('./routes/auth');
// console.log('DEBUG: backend/index.js - Finished requiring ./routes/auth'); // Removed debug log
// console.log('DEBUG: backend/index.js - Type of authRoutes:', typeof authRoutes); // Removed debug log
// console.log('DEBUG: backend/index.js - authRoutes:', authRoutes); // Removed debug log
app.use('/api/auth', authRoutes);
// app.use('/api/users', require('./routes/users')); // Example for other routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); 