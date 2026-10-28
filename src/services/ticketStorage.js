/**
 * BookLeaf Portal - Client-Side Persistent Ticket Storage
 * Ensures support tickets and replies persist across logouts, logins,
 * persona switching, and Vercel serverless function cold-starts.
 */

const STORAGE_KEY = 'bookleaf_persisted_tickets_v1';
const DELETED_KEY = 'bookleaf_deleted_ticket_ids_v1';

export const ticketStorage = {
  /**
   * Get all tickets stored in localStorage
   */
  getLocalTickets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      console.warn('Failed to read tickets from localStorage:', e);
      return null;
    }
  },

  /**
   * Get set of deleted ticket IDs to prevent resurrection
   */
  getDeletedIds() {
    try {
      const raw = localStorage.getItem(DELETED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Mark ticket as deleted
   */
  markDeleted(ticketId) {
    try {
      const deleted = this.getDeletedIds();
      if (!deleted.includes(ticketId)) {
        deleted.push(ticketId);
        localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
      }
      const existing = this.getLocalTickets() || [];
      const remaining = existing.filter((t) => t.id !== ticketId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Failed to record ticket deletion in localStorage:', e);
    }
  },

  /**
   * Save ticket array to localStorage
   */
  saveTickets(tickets) {
    try {
      const deleted = this.getDeletedIds();
      const filtered = (tickets || []).filter((t) => !deleted.includes(t.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to save tickets to localStorage:', e);
    }
  },

  /**
   * Merge server response with locally stored tickets
   * Preserves tickets created locally that server may have forgotten due to Vercel cold starts.
   */
  mergeWithServerTickets(serverTickets = []) {
    const deleted = this.getDeletedIds();
    const local = (this.getLocalTickets() || []).filter((t) => !deleted.includes(t.id));
    const validServer = serverTickets.filter((t) => !deleted.includes(t.id));

    if (!local || local.length === 0) {
      this.saveTickets(validServer);
      return validServer;
    }

    const ticketMap = new Map();

    // 1. Seed with server tickets
    validServer.forEach((st) => {
      ticketMap.set(st.id, st);
    });

    // 2. Merge local tickets (local custom tickets or local responses take precedence if newer)
    local.forEach((lt) => {
      if (!ticketMap.has(lt.id)) {
        // Ticket created locally but missing on server (e.g. serverless cold start)
        ticketMap.set(lt.id, lt);
      } else {
        const serverTicket = ticketMap.get(lt.id);
        const serverResponses = serverTicket.responses || [];
        const localResponses = lt.responses || [];

        // Merge responses without duplicates
        const respMap = new Map();
        serverResponses.forEach((r) => respMap.set(r.id, r));
        localResponses.forEach((r) => respMap.set(r.id, r));
        const mergedResponses = Array.from(respMap.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Merge internal notes
        const sNotes = serverTicket.internalNotes || [];
        const lNotes = lt.internalNotes || [];
        const noteMap = new Map();
        sNotes.forEach((n) => noteMap.set(n.id, n));
        lNotes.forEach((n) => noteMap.set(n.id, n));
        const mergedNotes = Array.from(noteMap.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        ticketMap.set(lt.id, {
          ...serverTicket,
          ...lt,
          status: lt.status || serverTicket.status,
          category: lt.category || serverTicket.category,
          priority: lt.priority || serverTicket.priority,
          assignedTo: lt.assignedTo !== undefined ? lt.assignedTo : serverTicket.assignedTo,
          responses: mergedResponses,
          internalNotes: mergedNotes,
          updatedAt: lt.updatedAt || serverTicket.updatedAt,
        });
      }
    });

    const merged = Array.from(ticketMap.values()).filter((t) => !deleted.includes(t.id));
    this.saveTickets(merged);
    return merged;
  },

  /**
   * Save a newly created ticket
   */
  addTicket(newTicket) {
    const existing = this.getLocalTickets() || [];
    const withoutSame = existing.filter((t) => t.id !== newTicket.id);
    const updated = [newTicket, ...withoutSame];
    this.saveTickets(updated);
    return newTicket;
  },

  /**
   * Save response to a ticket thread
   */
  addResponse(ticketId, response, updatedTicket) {
    const existing = this.getLocalTickets() || [];
    const updated = existing.map((t) => {
      if (t.id === ticketId) {
        const currentResponses = t.responses || [];
        const exists = currentResponses.some((r) => r.id === response.id);
        const newResponses = exists ? currentResponses : [...currentResponses, response];
        return {
          ...t,
          ...(updatedTicket || {}),
          status: updatedTicket?.status || (response.senderRole === 'admin' && t.status === 'Open' ? 'In Progress' : t.status),
          responses: newResponses,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    this.saveTickets(updated);
    return updated.find((t) => t.id === ticketId);
  },

  /**
   * Save internal note to a ticket
   */
  addInternalNote(ticketId, note, updatedTicket) {
    const existing = this.getLocalTickets() || [];
    const updated = existing.map((t) => {
      if (t.id === ticketId) {
        const currentNotes = t.internalNotes || [];
        const exists = currentNotes.some((n) => n.id === note.id);
        const newNotes = exists ? currentNotes : [...currentNotes, note];
        return {
          ...t,
          ...(updatedTicket || {}),
          internalNotes: newNotes,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    this.saveTickets(updated);
    return updated.find((t) => t.id === ticketId);
  },

  /**
   * Update ticket metadata (category, priority, status, assignedTo)
   */
  updateTicket(ticketId, updates) {
    const existing = this.getLocalTickets() || [];
    const updated = existing.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    this.saveTickets(updated);
    return updated.find((t) => t.id === ticketId);
  },
};
