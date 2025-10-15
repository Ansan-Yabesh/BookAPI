const mongoose = require('mongoose');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookapi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
