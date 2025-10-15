const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addToFavorites,
  getFavorites,
  removeFromFavorites
} = require('../controllers/bookController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', authenticate, authorize('manager', 'admin'), createBook);
router.put('/:id', authenticate, authorize('manager', 'admin'), updateBook);
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteBook);

router.post('/:bookId/favorites', authenticate, authorize('user'), addToFavorites);
router.get('/favorites', authenticate, authorize('user'), getFavorites);
router.delete('/:bookId/favorites', authenticate, authorize('user'), removeFromFavorites);

module.exports = router;
