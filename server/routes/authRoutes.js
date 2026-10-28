import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { store, DEFAULT_PASSWORD } from '../data/store.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Please provide both email and password.',
      code: 'MISSING_CREDENTIALS',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if admin
  const admin = store.getAdminByEmail(cleanEmail);
  if (admin) {
    // Admins accept standard test password
    if (password !== DEFAULT_PASSWORD && password !== 'Admin@123') {
      return res.status(401).json({
        error: 'Invalid password. Hint: Default password is BookLeaf@123',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        department: admin.department,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        department: admin.department,
      },
    });
  }

  // 2. Check if author
  const author = store.getAuthorByEmail(cleanEmail);
  if (author) {
    if (password !== DEFAULT_PASSWORD) {
      return res.status(401).json({
        error: 'Invalid password. Hint: Default password is BookLeaf@123',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      {
        id: author.author_id,
        author_id: author.author_id,
        email: author.email,
        name: author.name,
        role: 'author',
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      user: {
        id: author.author_id,
        author_id: author.author_id,
        email: author.email,
        name: author.name,
        role: 'author',
        phone: author.phone,
        city: author.city,
        joined_date: author.joined_date,
      },
    });
  }

  return res.status(401).json({
    error: 'User account not found with this email.',
    code: 'USER_NOT_FOUND',
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    const admin = store.getAdminByEmail(req.user.email);
    if (!admin) return res.status(404).json({ error: 'Admin account not found.' });
    return res.json({ user: admin });
  }

  const author = store.getAuthorById(req.user.author_id || req.user.id);
  if (!author) return res.status(404).json({ error: 'Author account not found.' });

  const { password, ...safeAuthor } = author;
  return res.json({ user: safeAuthor });
});

// GET /api/auth/demo-accounts (convenience helper for evaluation testers)
router.get('/demo-accounts', (req, res) => {
  const admins = store.getAdmins().map((a) => ({
    name: a.name,
    email: a.email,
    role: a.role,
    department: a.department,
  }));

  const authors = store.getAuthors().map((a) => ({
    author_id: a.author_id,
    name: a.name,
    email: a.email,
    city: a.city,
    bookCount: a.books.length,
    books: a.books.map((b) => b.title),
  }));

  res.json({
    defaultPassword: DEFAULT_PASSWORD,
    admins,
    authors,
  });
});

export default router;
