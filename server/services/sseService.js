/**
 * Server-Sent Events (SSE) Broadcaster
 * Provides real-time updates for tickets, messages, notes, and status changes
 * without requiring websockets or page refreshes.
 */
class SSEService {
  constructor() {
    this.clients = new Set();
  }

  addClient(res, clientInfo = {}) {
    const client = {
      id: Math.random().toString(36).substring(2, 9),
      res,
      ...clientInfo,
    };

    this.clients.add(client);

    // Initial keepalive comment
    res.write(`: connected at ${new Date().toISOString()}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(client);
    });

    return client.id;
  }

  broadcast(eventType, data = {}) {
    const payload = JSON.stringify({ eventType, timestamp: new Date().toISOString(), data });
    for (const client of this.clients) {
      try {
        client.res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  notifyTicketUpdated(ticket, extra = {}) {
    this.broadcast('TICKET_UPDATE', { ticket, ...extra });
  }

  notifyNewResponse(ticketId, response, ticket) {
    this.broadcast('NEW_RESPONSE', { ticketId, response, ticket });
  }

  notifyNewTicket(ticket) {
    this.broadcast('NEW_TICKET', { ticket });
  }

  notifyTicketDeleted(ticketId) {
    this.broadcast('TICKET_DELETED', { ticketId });
  }
}

export const sseService = new SSEService();
