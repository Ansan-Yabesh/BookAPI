import express from 'express';
import { getBooks, getBook, createBook, updateBook, deleteBook } from '../controllers/bookController.js';

const router = express.Router();

// Get all books
router.get('/', getBooks);

// Get single book
router.get('/:id', getBook);

// Create a new book
router.post('/', createBook);

// Update a book
router.put('/:id', updateBook);

// Delete a book
router.delete('/:id', deleteBook);

export default router;
