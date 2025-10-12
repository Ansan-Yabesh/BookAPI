import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ debug: false }); 

import bodyParser from 'body-parser';
import connectDB from './lib/db.js';
import booksRoutes from './routes/books.js';

const app = express();
const PORT = process.env.PORT; 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the database
connectDB();

// Use routes
app.use('/api/books', booksRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port 3K`);
});
