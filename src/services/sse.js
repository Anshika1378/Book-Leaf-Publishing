import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to connect to Server-Sent Events stream
 * Guarantees real-time updates for tickets and conversations without page refresh.
 */
export function useSSE(handlers = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep latest handlers without reconnecting SSE on every render
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const token = localStorage.getItem('bookleaf_token');
    const sseUrl = `/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    let es = null;
    let reconnectTimeout = null;

    function connect() {
      try {
        es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.onerror = () => {
          setIsConnected(false);
          es.close();
          // Reconnect attempt after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };

        es.addEventListener('TICKET_UPDATE', (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handlersRef.current.onTicketUpdate?.(parsed.data?.ticket, parsed.data);
          } catch (e) {
            console.error('Error parsing TICKET_UPDATE SSE:', e);
          }
        });

        es.addEventListener('NEW_RESPONSE', (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handlersRef.current.onNewResponse?.(
              parsed.data?.ticketId,
              parsed.data?.response,
              parsed.data?.ticket
            );
          } catch (e) {
            console.error('Error parsing NEW_RESPONSE SSE:', e);
          }
        });

        es.addEventListener('NEW_TICKET', (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handlersRef.current.onNewTicket?.(parsed.data?.ticket);
          } catch (e) {
            console.error('Error parsing NEW_TICKET SSE:', e);
          }
        });

        es.addEventListener('TICKET_DELETED', (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handlersRef.current.onTicketDeleted?.(parsed.data?.ticketId);
          } catch (e) {
            console.error('Error parsing TICKET_DELETED SSE:', e);
          }
        });
      } catch (err) {
        console.error('SSE initialization error:', err);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) {
        es.close();
      }
      setIsConnected(false);
    };
  }, []);

  return { isConnected };
}
