import express from 'express';
import { aiService } from '../services/aiService.js';
import { store } from '../data/store.js';
import { knowledgeBaseService } from '../services/knowledgeBaseService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/draft-response (Admin generates/refines draft response)
router.post('/draft-response', authenticateToken, requireAdmin, async (req, res) => {
  const { ticketId, tone = 'standard', customPrompt } = req.body || {};

  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId is required.' });
  }

  const ticket = store.getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  let bookDetails = null;
  if (ticket.bookId) {
    bookDetails = store.getBookById(ticket.bookId);
  }

  try {
    const draft = await aiService.generateDraftResponse({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      authorName: ticket.authorName,
      bookDetails,
      tone,
    });

    // Optionally save the new draft onto the ticket
    store.updateTicket(ticket.id, { aiDraftResponse: draft });

    return res.json({ draft, tone, ticketId: ticket.id });
  } catch (err) {
    console.error('Draft generation error:', err);
    return res.status(500).json({ error: 'Failed to generate AI draft.' });
  }
});

// POST /api/ai/classify (Ad-hoc classification for preview)
router.post('/classify', authenticateToken, async (req, res) => {
  const { subject, description, bookTitle } = req.body || {};
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  try {
    const result = await aiService.classifyTicket({ subject, description, bookTitle });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Classification failed.' });
  }
});

// GET /api/ai/knowledge-base (Expose KB rules for admin reference modal)
router.get('/knowledge-base', authenticateToken, (req, res) => {
  return res.json({
    categories: knowledgeBaseService.getAllCategories(),
  });
});

export default router;
