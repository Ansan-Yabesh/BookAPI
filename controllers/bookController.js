import Book from '../models/Book.js';
import Favorite from '../models/Favorite.js';
import { body, validationResult } from 'express-validator';

// Escape user input for use in RegExp
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getBooks = async (req, res) => {
  try {
    // Query params
    // q - text search across title, author, description
    // genres - comma separated list of genres to filter by
    // page - 1-based page number (default 1)
    const { q, genres, page = 1 } = req.query;
    const perPage = 10;

    const filter = {};

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { title: regex },
        { author: regex },
        { description: regex }
      ];
    }

    if (genres) {
      const genreList = genres.split(',').map(g => g.trim()).filter(Boolean);
      if (genreList.length) {
        // Use case-insensitive exact-match regexes for genres to make matching insensitive
        const genreRegexes = genreList.map(g => new RegExp(`^${escapeRegExp(g)}$`, 'i'));
        filter.genre = { $in: genreRegexes };
      }
    }

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * perPage;

    const [total, books] = await Promise.all([
      Book.countDocuments(filter),
      Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage)
    ]);

    const pages = Math.ceil(total / perPage) || 1;

    res.json({
      total,
      page: Math.max(parseInt(page, 10), 1),
      pages,
      perPage,
      results: books
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createBook = [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('genre').notEmpty().withMessage('Genre is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const book = new Book(req.body);
      await book.save();
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
];

const updateBook = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('genre').optional().notEmpty().withMessage('Genre cannot be empty'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const book = await Book.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
      if (!book) return res.status(404).json({ message: 'Book not found.' });
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
];

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const { bookId } = req.params;
    const favorite = new Favorite({ user: req.user._id, book: bookId });
    await favorite.save();
    res.status(201).json({ message: 'Book added to favorites.' });
  } catch (error) {
    if (error.code === 11000) res.status(400).json({ message: 'Book already in favorites.' });
    else res.status(500).json({ message: 'Server error.' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate('book');
    res.json(favorites.map(f => f.book));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const { bookId } = req.params;
    await Favorite.findOneAndDelete({ user: req.user._id, book: bookId });
    res.json({ message: 'Book removed from favorites.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addToFavorites,
  getFavorites,
  removeFromFavorites
};
