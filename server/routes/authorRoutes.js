import express from 'express';
import { store } from '../data/store.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/authors/books (returns author's books, or all books if admin)
router.get('/books', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    const authorId = req.query.authorId;
    if (authorId) {
      return res.json({ books: store.getBooksByAuthorId(authorId) });
    }
    return res.json({ books: store.getAllBooks() });
  }

  // Author can only see their own books
  const authorId = req.user.author_id || req.user.id;
  const books = store.getBooksByAuthorId(authorId);
  return res.json({ books });
});

// GET /api/authors/summary (Author-specific financial and publishing metrics)
router.get('/summary', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ stats: store.getStats() });
  }

  const authorId = req.user.author_id || req.user.id;
  const author = store.getAuthorById(authorId);
  if (!author) {
    return res.status(404).json({ error: 'Author not found.' });
  }

  let totalCopiesSold = 0;
  let totalRoyaltyEarned = 0;
  let royaltyPaid = 0;
  let royaltyPending = 0;
  let liveBooksCount = 0;
  let inProductionCount = 0;

  author.books.forEach((book) => {
    totalCopiesSold += book.total_copies_sold || 0;
    totalRoyaltyEarned += book.total_royalty_earned || 0;
    royaltyPaid += book.royalty_paid || 0;
    royaltyPending += book.royalty_pending || 0;

    if (book.status && book.status.toLowerCase().includes('in production')) {
      inProductionCount += 1;
    } else {
      liveBooksCount += 1;
    }
  });

  return res.json({
    author: {
      author_id: author.author_id,
      name: author.name,
      email: author.email,
      phone: author.phone,
      city: author.city,
      joined_date: author.joined_date,
    },
    metrics: {
      totalBooks: author.books.length,
      liveBooksCount,
      inProductionCount,
      totalCopiesSold,
      totalRoyaltyEarned,
      royaltyPaid,
      royaltyPending,
    },
  });
});

// GET /api/authors (Admin only: view all authors)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const safeAuthors = store.getAuthors().map(({ password, ...rest }) => rest);
  return res.json({ authors: safeAuthors });
});

export default router;
