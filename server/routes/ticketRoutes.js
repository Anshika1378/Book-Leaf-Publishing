import express from 'express';
import { store } from '../data/store.js';
import { aiService } from '../services/aiService.js';
import { sseService } from '../services/sseService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to sanitize ticket payload for author visibility
 * Requirement: Internal notes must NOT be visible to author.
 */
function sanitizeTicketForAuthor(ticket) {
  if (!ticket) return null;
  const { internalNotes, ...safeTicket } = ticket;
  return safeTicket;
}

// GET /api/tickets/stats (Admin stats)
router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
  return res.json({ stats: store.getStats() });
});

// POST /api/tickets/sync (Sync client-persisted tickets into server store)
router.post('/sync', authenticateToken, (req, res) => {
  const { tickets: clientTickets } = req.body || {};
  if (Array.isArray(clientTickets)) {
    store.syncClientTickets(clientTickets);
  }
  return res.json({ success: true, count: store.getAllTickets().length });
});

// GET /api/tickets (List tickets)
router.get('/', authenticateToken, (req, res) => {
  const { status, category, priority, search } = req.query;

  if (req.user.role === 'author') {
    const authorId = req.user.author_id || req.user.id;
    const authorTickets = store.getTicketsByAuthorId(authorId);
    return res.json({
      tickets: authorTickets.map(sanitizeTicketForAuthor),
    });
  }

  // Admin view: all tickets with search and filters
  const allTickets = store.getAllTickets({ status, category, priority, search });
  return res.json({
    tickets: allTickets,
  });
});

// GET /api/tickets/:id (Ticket detail)
router.get('/:id', authenticateToken, (req, res) => {
  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.', code: 'TICKET_NOT_FOUND' });
  }

  // Author can only see their own ticket
  if (req.user.role === 'author') {
    const authorId = req.user.author_id || req.user.id;
    if (ticket.authorId !== authorId) {
      return res.status(403).json({ error: 'Access denied to this ticket.', code: 'FORBIDDEN' });
    }
    return res.json({ ticket: sanitizeTicketForAuthor(ticket) });
  }

  // Admin view
  return res.json({ ticket });
});

// POST /api/tickets (Author raises a support ticket)
router.post('/', authenticateToken, async (req, res) => {
  const { bookId, subject, description, attachments } = req.body || {};

  if (!subject || !subject.trim() || !description || !description.trim()) {
    return res.status(400).json({
      error: 'Subject and detailed description are required.',
      code: 'VALIDATION_FAILED',
    });
  }

  // Identify author
  const authorId = req.user.role === 'author' ? (req.user.author_id || req.user.id) : (req.body.authorId || 'AUTH001');
  const author = store.getAuthorById(authorId);
  const authorName = author ? author.name : req.user.name || 'Author';
  const authorEmail = author ? author.email : req.user.email;

  // Book metadata lookup
  let bookTitle = 'General / Account Level';
  let bookDetails = null;
  if (bookId && bookId !== 'general') {
    bookDetails = store.getBookById(bookId);
    if (bookDetails) {
      bookTitle = bookDetails.title;
    }
  }

  // Step 1: AI Auto-Classification & Priority Scoring
  let aiClassification = null;
  try {
    aiClassification = await aiService.classifyTicket({
      subject,
      description,
      bookTitle,
    });
  } catch (err) {
    console.error('AI Classification failed, using fallback:', err);
    aiClassification = {
      category: 'General Inquiry',
      priority: 'Medium',
      confidence: 0.85,
      reasoning: 'Fallback classification on system intake.',
    };
  }

  // Step 2: AI Pre-drafted response grounded in BookLeaf Knowledge Base
  let aiDraftResponse = '';
  try {
    aiDraftResponse = await aiService.generateDraftResponse({
      subject,
      description,
      category: aiClassification.category,
      authorName,
      bookDetails,
      tone: 'standard',
    });
  } catch (err) {
    console.error('AI Draft Generation failed, continuing:', err);
    aiDraftResponse = 'Thank you for contacting BookLeaf. Our author support specialist is reviewing your query.';
  }

  // Create ticket in store
  const newTicket = store.createTicket({
    authorId,
    authorName,
    authorEmail,
    bookId: bookId && bookId !== 'general' ? bookId : null,
    bookTitle,
    category: aiClassification.category,
    priority: aiClassification.priority,
    subject: subject.trim(),
    description: description.trim(),
    aiClassification,
    aiDraftResponse,
    attachments: attachments || [],
  });

  // Real-time broadcast
  sseService.notifyNewTicket(newTicket);

  // Return sanitized version if author
  if (req.user.role === 'author') {
    return res.status(201).json({ ticket: sanitizeTicketForAuthor(newTicket) });
  }

  return res.status(201).json({ ticket: newTicket });
});

// POST /api/tickets/:id/responses (Send response in ticket thread)
router.post('/:id/responses', authenticateToken, (req, res) => {
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Response message cannot be empty.' });
  }

  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  // Check authorization
  if (req.user.role === 'author') {
    const authorId = req.user.author_id || req.user.id;
    if (ticket.authorId !== authorId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
  }

  const senderRole = req.user.role;
  const senderName = req.user.name || (senderRole === 'admin' ? 'BookLeaf Support' : 'Author');
  const senderEmail = req.user.email;

  const result = store.addTicketResponse(ticket.id, {
    senderRole,
    senderName,
    senderEmail,
    message: message.trim(),
  });

  if (!result) {
    return res.status(500).json({ error: 'Failed to record response.' });
  }

  // Real-time notify connected clients
  sseService.notifyNewResponse(ticket.id, result.response, result.ticket);

  const payloadTicket = req.user.role === 'author' ? sanitizeTicketForAuthor(result.ticket) : result.ticket;
  return res.json({ ticket: payloadTicket, response: result.response });
});

// PATCH /api/tickets/:id (Ticket Management: status, category, priority, assignee)
router.patch('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { status, category, priority, assignedTo } = req.body || {};
  const ticket = store.getTicketById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (category) updates.category = category;
  if (priority) updates.priority = priority;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;

  const updatedTicket = store.updateTicket(ticket.id, updates);
  sseService.notifyTicketUpdated(updatedTicket);

  return res.json({ ticket: updatedTicket });
});

// POST /api/tickets/:id/notes (Admin Internal Notes - strictly confidential)
router.post('/:id/notes', authenticateToken, requireAdmin, (req, res) => {
  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content cannot be empty.' });
  }

  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const result = store.addTicketInternalNote(ticket.id, {
    authorEmail: req.user.email,
    authorName: req.user.name || 'Admin',
    content: content.trim(),
  });

  // Notify admin SSE listeners
  sseService.notifyTicketUpdated(result.ticket, { noteAdded: true });

  return res.json({ ticket: result.ticket, note: result.note });
});

// DELETE /api/tickets/:id (Author can delete their own ticket, Admin can delete any ticket)
router.delete('/:id', authenticateToken, (req, res) => {
  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.', code: 'NOT_FOUND' });
  }

  // Permission check: Author can only delete their own ticket
  if (req.user.role === 'author') {
    const authorId = req.user.author_id || req.user.id;
    if (ticket.authorId !== authorId) {
      return res.status(403).json({
        error: 'Access denied: You can only delete your own support queries.',
        code: 'FORBIDDEN',
      });
    }
  }

  const success = store.deleteTicket(ticket.id);
  if (!success) {
    return res.status(500).json({ error: 'Failed to delete ticket.' });
  }

  // Broadcast deletion to both author and admin clients via SSE
  sseService.notifyTicketDeleted(ticket.id);

  return res.json({
    success: true,
    message: 'Ticket deleted successfully.',
    ticketId: ticket.id,
  });
});

export default router;
