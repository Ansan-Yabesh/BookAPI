const Book = require('../models/Book');
const Favorite = require('../models/Favorite');
const { body, validationResult } = require('express-validator');

const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
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

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addToFavorites,
  getFavorites,
  removeFromFavorites
};
