const API_BASE = '/api';

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
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.category) searchParams.append('category', params.category);
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.search) searchParams.append('search', params.search);
      const queryStr = searchParams.toString();
      return request(`/tickets${queryStr ? `?${queryStr}` : ''}`);
    },
    getById: (id) => request(`/tickets/${id}`),
    create: (ticketData) =>
      request('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      }),
    sendResponse: (ticketId, message) =>
      request(`/tickets/${ticketId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    update: (ticketId, updates) =>
      request(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    addInternalNote: (ticketId, content) =>
      request(`/tickets/${ticketId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    delete: (ticketId) =>
      request(`/tickets/${ticketId}`, {
        method: 'DELETE',
      }),
    getStats: () => request('/tickets/stats/overview'),
  },

  // AI Assistant
  ai: {
    generateDraft: (ticketId, tone = 'standard') =>
      request('/ai/draft-response', {
        method: 'POST',
        body: JSON.stringify({ ticketId, tone }),
      }),
    classify: (subject, description, bookTitle) =>
      request('/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ subject, description, bookTitle }),
      }),
    getKnowledgeBase: () => request('/ai/knowledge-base'),
  },
};
