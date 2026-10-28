import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = 'http://127.0.0.1:4000';

test('1. Author login endpoint returns JWT and author profile', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  assert.equal(data.user.role, 'author');
  assert.equal(data.user.email, 'priya.sharma@email.com');
  assert.equal(data.user.author_id, 'AUTH001');
});

test('2. Admin login endpoint returns JWT with admin privileges', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bookleaf.in', password: 'BookLeaf@123' }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  assert.equal(data.user.role, 'admin');
  assert.equal(data.user.email, 'admin@bookleaf.in');
});

test('3. RBAC: Author cannot access admin-only analytics overview', async () => {
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });
  const { token } = await authRes.json();

  const res = await fetch(`${baseUrl}/api/tickets/stats/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 403);
});

test('4. Data Isolation: Author only accesses their own published books', async () => {
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });
  const { token } = await authRes.json();

  const res = await fetch(`${baseUrl}/api/authors/books`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 200);
  const { books } = await res.json();
  assert.ok(Array.isArray(books));
  assert.equal(books.length, 2);
  assert.equal(books[0].title, 'Whispers of the Ganges');
  assert.equal(books[1].title, 'The Saffron Diaries');
});

test('5. Ticket Submission & AI Auto-Classification with Priority & Draft Generation', async () => {
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });
  const { token } = await authRes.json();

  const res = await fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookId: 'BK001',
      subject: 'Critical mismatch on ISBN across Amazon',
      description: 'The physical copy has a different ISBN than what readers are seeing on Amazon India.',
    }),
  });

  assert.equal(res.status, 201);
  const { ticket } = await res.json();
  assert.ok(ticket.id);
  assert.equal(ticket.authorId, 'AUTH001');
  assert.equal(ticket.category, 'ISBN & Metadata Issues');
  assert.equal(ticket.priority, 'Critical');
  assert.ok(ticket.aiDraftResponse.length > 50);
  assert.equal(ticket.internalNotes, undefined);
});

test('6. Admin Ticket Management: Notes Confidentiality & Status Progression', async () => {
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bookleaf.in', password: 'BookLeaf@123' }),
  });
  const { token: adminToken } = await adminRes.json();

  const noteRes = await fetch(`${baseUrl}/api/tickets/TICK-1001/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ content: 'Confidential: Escalate to Senior Accountant.' }),
  });
  assert.equal(noteRes.status, 200);

  const authorRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });
  const { token: authorToken } = await authorRes.json();

  const authorTicketRes = await fetch(`${baseUrl}/api/tickets/TICK-1001`, {
    headers: { Authorization: `Bearer ${authorToken}` },
  });
  assert.equal(authorTicketRes.status, 200);
  const { ticket: authorViewTicket } = await authorTicketRes.json();
  assert.equal(authorViewTicket.internalNotes, undefined);
});

test('7. Ticket Deletion: Author deletes own ticket and RBAC rejects unauthorized deletion', async () => {
  // Login as Priya
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' }),
  });
  const { token: priyaToken } = await authRes.json();

  // Create a ticket to delete
  const createRes = await fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({
      subject: 'Temporary test query for deletion',
      description: 'This query will be deleted.',
    }),
  });
  assert.equal(createRes.status, 201);
  const { ticket } = await createRes.json();

  // Priya deletes her own ticket
  const deleteRes = await fetch(`${baseUrl}/api/tickets/${ticket.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);

  // Verify it is gone
  const getRes = await fetch(`${baseUrl}/api/tickets/${ticket.id}`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  assert.equal(getRes.status, 404);
});

