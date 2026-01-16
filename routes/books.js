// import express from 'express';
// import {
//   getBooks,
//   getBook,
//   createBook,
//   updateBook,
//   deleteBook,
//   addToFavorites,
//   getFavorites,
//   removeFromFavorites
// } from '../controllers/bookController.js';
// import { authenticate, authorize } from '../middleware/auth.js';

// const router = express.Router();

// router.get('/', getBooks);
// router.get('/:id', getBook);
// router.post('/', authenticate, authorize('manager', 'admin'), createBook);
// router.put('/:id', authenticate, authorize('manager', 'admin'), updateBook);
// router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteBook);

// router.post('/:bookId/favorites', authenticate, authorize('user'), addToFavorites);
// router.get('/favorites', authenticate, authorize('user'), getFavorites);
// router.delete('/:bookId/favorites', authenticate, authorize('user'), removeFromFavorites);

// export default router;



import express from 'express';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addToFavorites,
  getFavorites,
  removeFromFavorites
} from '../controllers/bookController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 📚 Book routes
router.get('/', getBooks);

// Always define static routes first (like /favorites) before dynamic routes (like /:id)
router.get('/favorites', authenticate, authorize('user'), getFavorites);
router.post('/:bookId/favorites', authenticate, authorize('user'), addToFavorites);
router.delete('/:bookId/favorites', authenticate, authorize('user'), removeFromFavorites);

router.get('/:id', getBook);
router.post('/', authenticate, authorize('manager', 'admin'), createBook);
router.put('/:id', authenticate, authorize('manager', 'admin'), updateBook);
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteBook);

export default router;
