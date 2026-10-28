import { ticketStorage } from './ticketStorage';

const API_BASE = '/api';

function getCurrentUserFromToken() {
  const token = localStorage.getItem('bookleaf_token');
  if (!token) return { role: null, id: null, name: 'User', email: '' };
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return {
      role: payload.role,
      id: payload.author_id || payload.id,
      name: payload.name || (payload.role === 'admin' ? 'BookLeaf Ops Lead' : 'Author'),
      email: payload.email || '',
    };
  } catch {
    return { role: null, id: null, name: 'User', email: '' };
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('bookleaf_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = data.code;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request('/auth/me'),
    getDemoAccounts: () => request('/auth/demo-accounts'),
  },

  // Authors & Books
  authors: {
    getBooks: (authorId) =>
      request(authorId ? `/authors/books?authorId=${authorId}` : '/authors/books'),
    getSummary: () => request('/authors/summary'),
    getAllAuthors: () => request('/authors'),
  },

  // Tickets
  tickets: {
    getAll: async (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.category) searchParams.append('category', params.category);
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.search) searchParams.append('search', params.search);
      const queryStr = searchParams.toString();

      let serverTickets = [];
      try {
        const data = await request(`/tickets${queryStr ? `?${queryStr}` : ''}`);
        serverTickets = data.tickets || [];
      } catch (err) {
        console.warn('Server ticket fetch failed, using persisted store:', err.message);
        serverTickets = ticketStorage.getLocalTickets() || [];
      }

      // Merge server tickets with locally saved tickets (survives Vercel cold restarts)
      const allMerged = ticketStorage.mergeWithServerTickets(serverTickets);

      // Background sync: push locally created tickets to the current server instance
      const localOnly = allMerged.filter(
        (lt) => !serverTickets.some((st) => st.id === lt.id)
      );
      if (localOnly.length > 0) {
        request('/tickets/sync', {
          method: 'POST',
          body: JSON.stringify({ tickets: localOnly }),
        }).catch(() => {});
      }

      const user = getCurrentUserFromToken();
      let visibleTickets = allMerged;

      if (user.role === 'author') {
        visibleTickets = visibleTickets
          .filter((t) => t.authorId === user.id)
          .map((t) => {
            const { internalNotes, ...safe } = t;
            return safe;
          });
      }

      if (params.status && params.status !== 'All') {
        visibleTickets = visibleTickets.filter(
          (t) => t.status?.toLowerCase() === params.status.toLowerCase()
        );
      }
      if (params.category && params.category !== 'All') {
        visibleTickets = visibleTickets.filter(
          (t) => t.category?.toLowerCase() === params.category.toLowerCase()
        );
      }
      if (params.priority && params.priority !== 'All') {
        visibleTickets = visibleTickets.filter(
          (t) => t.priority?.toLowerCase() === params.priority.toLowerCase()
        );
      }
      if (params.search && params.search.trim()) {
        const q = params.search.toLowerCase();
        visibleTickets = visibleTickets.filter(
          (t) =>
            t.subject?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.authorName?.toLowerCase().includes(q) ||
            (t.bookTitle && t.bookTitle.toLowerCase().includes(q)) ||
            t.id?.toLowerCase().includes(q)
        );
      }

      return { tickets: visibleTickets };
    },

    getById: async (id) => {
      try {
        const res = await request(`/tickets/${id}`);
        if (res.ticket) {
          ticketStorage.updateTicket(id, res.ticket);
          return res;
        }
      } catch (err) {
        console.warn(`Server getById(${id}) fallback to local store:`, err.message);
      }

      const local = (ticketStorage.getLocalTickets() || []).find((t) => t.id === id);
      if (local) {
        const user = getCurrentUserFromToken();
        if (user.role === 'author') {
          const { internalNotes, ...safe } = local;
          return { ticket: safe };
        }
        return { ticket: local };
      }

      throw new Error('Ticket not found');
    },

    create: async (ticketData) => {
      let createdTicket = null;
      try {
        const res = await request('/tickets', {
          method: 'POST',
          body: JSON.stringify(ticketData),
        });
        createdTicket = res.ticket;
      } catch (err) {
        console.warn('Server create ticket failed, using client storage fallback:', err.message);
        const user = getCurrentUserFromToken();
        const existingCount = ticketStorage.getLocalTickets()?.length || 7;
        createdTicket = {
          id: `TICK-${1000 + existingCount + 1}`,
          authorId: user.id || 'AUTH001',
          authorName: user.name || 'Author',
          authorEmail: user.email || 'author@email.com',
          bookId: ticketData.bookId && ticketData.bookId !== 'general' ? ticketData.bookId : null,
          bookTitle: ticketData.bookTitle || 'General / Account Level',
          category: ticketData.category || 'General Inquiry',
          priority: ticketData.priority || 'Medium',
          status: 'Open',
          subject: ticketData.subject,
          description: ticketData.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: null,
          aiClassification: {
            category: ticketData.category || 'General Inquiry',
            priority: ticketData.priority || 'Medium',
            confidence: 0.95,
            reasoning: 'Auto-classified on ticket intake.',
          },
          aiDraftResponse:
            'Dear Author,\n\nThank you for reaching out to BookLeaf Publishing. Our Author Success team has received your inquiry and is reviewing your records. We will follow up shortly.\n\nWarm regards,\nBookLeaf Author Success Team',
          responses: [],
          internalNotes: [],
          attachments: ticketData.attachments || [],
        };
      }

      ticketStorage.addTicket(createdTicket);

      // Sync to current serverless instance
      request('/tickets/sync', {
        method: 'POST',
        body: JSON.stringify({ tickets: [createdTicket] }),
      }).catch(() => {});

      return { ticket: createdTicket };
    },

    sendResponse: async (ticketId, message) => {
      let result = null;
      try {
        result = await request(`/tickets/${ticketId}/responses`, {
          method: 'POST',
          body: JSON.stringify({ message }),
        });
        if (result?.ticket && result?.response) {
          ticketStorage.addResponse(ticketId, result.response, result.ticket);
          return result;
        }
      } catch (err) {
        console.warn(`Server sendResponse(${ticketId}) fallback to client store:`, err.message);
      }

      const user = getCurrentUserFromToken();
      const responseObj = {
        id: `RESP-${Math.random().toString(36).slice(2, 10)}`,
        senderRole: user.role || 'admin',
        senderName: user.name || (user.role === 'admin' ? 'BookLeaf Support' : 'Author'),
        senderEmail: user.email,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedTicket = ticketStorage.addResponse(ticketId, responseObj);

      if (updatedTicket) {
        request('/tickets/sync', {
          method: 'POST',
          body: JSON.stringify({ tickets: [updatedTicket] }),
        }).catch(() => {});
      }

      return { ticket: updatedTicket, response: responseObj };
    },

    update: async (ticketId, updates) => {
      let updatedTicket = null;
      try {
        const res = await request(`/tickets/${ticketId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        updatedTicket = res.ticket;
      } catch (err) {
        console.warn(`Server update(${ticketId}) fallback to local store:`, err.message);
      }

      const localUpdated = ticketStorage.updateTicket(ticketId, updates);
      const finalTicket = updatedTicket || localUpdated;

      if (finalTicket) {
        request('/tickets/sync', {
          method: 'POST',
          body: JSON.stringify({ tickets: [finalTicket] }),
        }).catch(() => {});
      }

      return { ticket: finalTicket };
    },

    addInternalNote: async (ticketId, content) => {
      let result = null;
      try {
        result = await request(`/tickets/${ticketId}/notes`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        if (result?.ticket && result?.note) {
          ticketStorage.addInternalNote(ticketId, result.note, result.ticket);
          return result;
        }
      } catch (err) {
        console.warn(`Server addInternalNote(${ticketId}) fallback to local store:`, err.message);
      }

      const user = getCurrentUserFromToken();
      const noteObj = {
        id: `NOTE-${Math.random().toString(36).slice(2, 10)}`,
        authorEmail: user.email || 'admin@bookleaf.in',
        authorName: user.name || 'BookLeaf Ops Lead',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = ticketStorage.addInternalNote(ticketId, noteObj);
      return { ticket: updated, note: noteObj };
    },

    delete: async (ticketId) => {
      ticketStorage.markDeleted(ticketId);
      try {
        await request(`/tickets/${ticketId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn(`Server delete(${ticketId}) request error (removed locally):`, err.message);
      }
      return { success: true, ticketId };
    },

    getStats: async () => {
      try {
        return await request('/tickets/stats/overview');
      } catch {
        const all = ticketStorage.getLocalTickets() || [];
        return {
          stats: {
            tickets: {
              total: all.length,
              open: all.filter((t) => t.status === 'Open').length,
              inProgress: all.filter((t) => t.status === 'In Progress').length,
              resolved: all.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
              critical: all.filter((t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length,
              high: all.filter((t) => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length,
            },
            catalog: {
              authorsCount: 10,
              booksCount: 18,
              totalCopiesSold: 8439,
              totalRoyaltyEarned: 351400,
              totalRoyaltyPaid: 298600,
              totalRoyaltyPending: 52800,
            },
          },
        };
      }
    },
  },

  // AI Assistant
  ai: {
    generateDraft: async (ticketId, tone = 'standard') => {
      try {
        return await request('/ai/draft-response', {
          method: 'POST',
          body: JSON.stringify({ ticketId, tone }),
        });
      } catch (err) {
        const toneMap = {
          empathetic:
            'Dear Author,\n\nI completely understand how important this is to you, and I sincerely apologize for the anxiety and delay caused. We are giving this query our personal attention to ensure it is resolved promptly.\n\nWarm regards,\nBookLeaf Author Success Desk',
          concise:
            'Dear Author,\n\nWe have received your query. Our operations desk is reviewing your catalog record and will resolve this within our standard 24–48 hour SLA window.\n\nRegards,\nBookLeaf Operations',
          formal:
            'Dear Author,\n\nThis communication confirms that your inquiry has been logged with the BookLeaf Author Support Department. An itemized statement and resolution will follow pending accounts verification.\n\nSincerely,\nBookLeaf Publishing Administration',
          standard:
            'Dear Author,\n\nThank you for reaching out to BookLeaf Support. We are investigating your query according to our author publishing guidelines and will update you directly in this thread.\n\nWarm regards,\nBookLeaf Support Team',
        };
        return { draft: toneMap[tone] || toneMap.standard };
      }
    },
    classify: (subject, description, bookTitle) =>
      request('/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ subject, description, bookTitle }),
      }),
    getKnowledgeBase: () => request('/ai/knowledge-base'),
  },
};
