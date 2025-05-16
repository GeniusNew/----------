const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cardPoolRoutes = require('./routes/cardPoolRoutes');
const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cardpool', cardPoolRoutes);
app.use('/api/user', userRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Card Game API is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 