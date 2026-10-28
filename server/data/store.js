import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDataPath = path.join(__dirname, 'bookleaf_sample_data.json');
const sampleData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));

// Standard testing password for all sample accounts
export const DEFAULT_PASSWORD = 'BookLeaf@123';

// Admin users loaded from bookleaf_sample_data.json
const adminUsers = (sampleData.admins || [
  {
    id: 'ADMIN001',
    name: 'BookLeaf Ops Lead',
    email: 'admin@bookleaf.in',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    department: 'Author Success & Operations',
  },
  {
    id: 'ADMIN002',
    name: 'Royalty & Support Specialist',
    email: 'support@bookleafpub.com',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    department: 'Royalty & Production',
  },
]).map((adm) => ({
  ...adm,
  password: adm.password || DEFAULT_PASSWORD,
}));

// Initialize in-memory store
const authors = sampleData.authors.map((author) => ({
  ...author,
  role: 'author',
  password: DEFAULT_PASSWORD,
}));

// Pre-seed realistic tickets matching the exact scenarios from the prompt
const initialTickets = [
  {
    id: 'TICK-1001',
    authorId: 'AUTH001',
    authorName: 'Priya Sharma',
    authorEmail: 'priya.sharma@email.com',
    bookId: 'BK001',
    bookTitle: 'Whispers of the Ganges',
    category: 'Royalty & Payments',
    priority: 'High',
    status: 'Open',
    subject: 'Delayed quarterly royalty payout question',
    description: 'I published my book 4 months ago and still haven’t received any royalty. What’s going on?',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    assignedTo: 'admin@bookleaf.in',
    aiClassification: {
      category: 'Royalty & Payments',
      priority: 'High',
      confidence: 0.96,
      reasoning: 'Author expresses frustration regarding delayed quarterly payouts beyond 4 months.',
    },
    aiDraftResponse: 'Dear Priya,\n\nI understand your concern regarding your royalty payout and apologize for the anxiety this delay has caused. At BookLeaf, royalties follow a quarterly cycle and are processed within 45 days following the quarter close.\n\nOur records show your title "Whispers of the Ganges" has earned ₹11,970 with ₹3,570 currently pending. Payouts require a verified linked bank account and a ₹1,000 minimum threshold. I am escalating your account to our finance desk immediately to verify your bank link and process the ₹3,570 pending clearance within 48 hours.\n\nPlease verify that your bank details in your Author Dashboard under Account Settings are up to date.\n\nWarm regards,\nBookLeaf Author Success Team',
    responses: [],
    internalNotes: [
      {
        id: 'NOTE-1',
        authorEmail: 'admin@bookleaf.in',
        authorName: 'BookLeaf Ops Lead',
        content: 'Checked bank records: Author updated IFSC code last week. Finance needs to re-trigger NEFT.',
        createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      },
    ],
    attachments: [],
  },
  {
    id: 'TICK-1002',
    authorId: 'AUTH002',
    authorName: 'Rohit Kapoor',
    authorEmail: 'rohit.kapoor@email.com',
    bookId: 'BK004',
    bookTitle: 'Startup Sutra',
    category: 'Royalty & Payments',
    priority: 'Medium',
    status: 'In Progress',
    subject: 'Royalty calculation question for 200 copies sold',
    description: 'My royalty amount seems too low. I sold 200 copies this month but only received ₹3,000. Could you explain how this was calculated?',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    assignedTo: 'support@bookleafpub.com',
    aiClassification: {
      category: 'Royalty & Payments',
      priority: 'Medium',
      confidence: 0.94,
      reasoning: 'Author requests clarification on the 80/20 net profit royalty calculation.',
    },
    aiDraftResponse: 'Dear Rohit,\n\nThank you for reaching out, and we completely appreciate you wanting total transparency on your earnings for "Startup Sutra".\n\nBookLeaf operates on an 80/20 net profit split. Net profit is calculated as the book MRP minus the printing cost, retail platform commission (Amazon/Flipkart at ~45-50%), and shipping charges. Your author royalty per copy is ₹48 on standard channels.\n\nWe would be glad to share a line-by-line breakdown showing exact channel fees and print deduction per copy. I have requested our accounts team to attach the CSV report to your dashboard within 24 hours.\n\nWarm regards,\nBookLeaf Author Support',
    responses: [
      {
        id: 'RESP-1',
        senderRole: 'admin',
        senderName: 'Support Specialist',
        senderEmail: 'support@bookleafpub.com',
        message: 'Dear Rohit, thanks for reaching out. We are generating your detailed platform commission breakdown and will share the itemized report shortly.',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
    internalNotes: [],
    attachments: [],
  },
  {
    id: 'TICK-1003',
    authorId: 'AUTH003',
    authorName: 'Ananya Reddy',
    authorEmail: 'ananya.reddy@email.com',
    bookId: 'BK005',
    bookTitle: 'Between Two Temples',
    category: 'ISBN & Metadata Issues',
    priority: 'Critical',
    status: 'Open',
    subject: 'ISBN mismatch on Amazon listing',
    description: 'My book is showing a different ISBN on Amazon than what is printed on the physical copy. Readers are reporting errors finding the paperback!',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    assignedTo: null,
    aiClassification: {
      category: 'ISBN & Metadata Issues',
      priority: 'Critical',
      confidence: 0.98,
      reasoning: 'Discrepancy in official ISBN imprint on Amazon vs physical copy represents an urgent catalog sync error.',
    },
    aiDraftResponse: 'Dear Ananya,\n\nThank you for bringing this to our attention immediately. We treat any ISBN mismatch with the highest priority, as ISBN integrity is critical for distributor discovery.\n\nWe have escalated this directly to our senior production and distributor catalog team. They will audit the Bowker/Nielsen metadata feed and Amazon Seller Central linkage to rectify the mismatch. We are committed to resolving this within 48 hours.\n\nWe will update you here the moment the catalog re-link is verified.\n\nWarm regards,\nBookLeaf Production Team',
    responses: [],
    internalNotes: [],
    attachments: [],
  },
  {
    id: 'TICK-1004',
    authorId: 'AUTH004',
    authorName: 'Vikram Joshi',
    authorEmail: 'vikram.joshi@email.com',
    bookId: 'BK006',
    bookTitle: 'Debugging Life',
    category: 'Printing & Quality',
    priority: 'High',
    status: 'Open',
    subject: 'Author copies print defect & binding misalignment',
    description: 'I received my 10 author copies and the print quality is terrible. The images are blurry and pages are misaligned at the spine.',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    assignedTo: null,
    aiClassification: {
      category: 'Printing & Quality',
      priority: 'High',
      confidence: 0.95,
      reasoning: 'Author copies received with physical defects; triggers free reprint SLA upon defect verification.',
    },
    aiDraftResponse: 'Dear Vikram,\n\nWe sincerely apologize for the poor print quality you experienced with your author copies of "Debugging Life". We take immense pride in our craftsmanship, and this falls short of our standards.\n\nBookLeaf guarantees free reprints for any manufacturing or binding defects. Could you kindly upload 2–3 clear photographs showing the blurry images and misaligned spine? Once verified by our Delhi print plant QA, we will dispatch replacement copies within 5–7 business days at no cost to you.\n\nWarm regards,\nBookLeaf Quality Assurance',
    responses: [],
    internalNotes: [],
    attachments: [],
  },
  {
    id: 'TICK-1005',
    authorId: 'AUTH005',
    authorName: 'Meera Nair',
    authorEmail: 'meera.nair@email.com',
    bookId: 'BK009',
    bookTitle: 'Letters from Lakshadweep',
    category: 'Distribution & Availability',
    priority: 'Medium',
    status: 'Open',
    subject: 'Book showing Currently Unavailable on Amazon India',
    description: 'My book is published but it’s showing as “Currently Unavailable” on Amazon. How can readers buy it?',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    assignedTo: null,
    aiClassification: {
      category: 'Distribution & Availability',
      priority: 'Medium',
      confidence: 0.93,
      reasoning: 'Common marketplace stock synchronization delay; standard 24–48h re-sync required.',
    },
    aiDraftResponse: 'Dear Meera,\n\nThank you for alerting us. When an active title displays as "Currently Unavailable" on Amazon, it is typically a temporary inventory API synchronization lag between our Delhi warehouse and Amazon’s catalog.\n\nOur distribution desk has already initiated an automated inventory re-sync. The listing will reflect available inventory within 24 to 48 hours.\n\nIn the meantime, your book remains active and orderable directly on the BookLeaf Store.\n\nWarm regards,\nBookLeaf Distribution Team',
    responses: [],
    internalNotes: [],
    attachments: [],
  },
  {
    id: 'TICK-1006',
    authorId: 'AUTH007',
    authorName: 'Sneha Kulkarni',
    authorEmail: 'sneha.kulkarni@email.com',
    bookId: 'BK013',
    bookTitle: 'Midnight in Mysore',
    category: 'Book Status & Production Updates',
    priority: 'Medium',
    status: 'Open',
    subject: 'Cover design progress inquiry',
    description: 'It’s been 3 weeks and my book is still in typesetting / cover design. When will it be done?',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    assignedTo: null,
    aiClassification: {
      category: 'Book Status & Production Updates',
      priority: 'Medium',
      confidence: 0.92,
      reasoning: 'Inquiry regarding production milestone timeline for in-progress title.',
    },
    aiDraftResponse: 'Dear Sneha,\n\nThank you for checking in on "Midnight in Mysore". We know how exciting it is to see your manuscript take physical form!\n\nYour title is currently at the Cover Design stage. Our design team submitted draft concepts on your portal on the 18th and is waiting for your selection of the typography palette. Once approved, typesetting and proofreading take approximately 7 business days.\n\nPlease check the proof review link in your dashboard or let us know if you would like alternative cover layouts.\n\nWarm regards,\nBookLeaf Editorial & Design Team',
    responses: [],
    internalNotes: [],
    attachments: [],
  },
  {
    id: 'TICK-1007',
    authorId: 'AUTH006',
    authorName: 'Arjun Malhotra',
    authorEmail: 'arjun.malhotra@email.com',
    bookId: 'BK010',
    bookTitle: 'Turban Tales',
    category: 'General Inquiry',
    priority: 'Low',
    status: 'Resolved',
    subject: 'Updating Amazon description after book is live',
    description: 'Can I update the description of my book on Amazon after it’s already live? I have added a new endorsement quote from a reviewer.',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    assignedTo: 'admin@bookleaf.in',
    aiClassification: {
      category: 'General Inquiry',
      priority: 'Low',
      confidence: 0.97,
      reasoning: 'Post-launch metadata update request with standard 3-5 day SLA.',
    },
    aiDraftResponse: 'Dear Arjun,\n\nYes, absolutely! You can update your book description, blurb, and editorial endorsements at any point after publication.\n\nPlease reply directly to this ticket with your revised description text. Our distribution team will push the updated metadata across Amazon, Flipkart, and the BookLeaf Store, which typically reflects within 3–5 business days.\n\nWarm regards,\nBookLeaf Operations',
    responses: [
      {
        id: 'RESP-2',
        senderRole: 'admin',
        senderName: 'BookLeaf Ops Lead',
        senderEmail: 'admin@bookleaf.in',
        message: 'Dear Arjun, yes absolutely! Please reply with your revised text and endorsement quote. Our team will push the update to Amazon and Flipkart within 3–5 business days.',
        createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      },
      {
        id: 'RESP-3',
        senderRole: 'author',
        senderName: 'Arjun Malhotra',
        senderEmail: 'arjun.malhotra@email.com',
        message: 'Thank you so much! I have sent the quote. You can mark this resolved.',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    internalNotes: [],
    attachments: [],
  },
];

const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'bookleaf_tickets_db.json')
  : path.join(__dirname, 'tickets_db.json');

function loadPersistedTickets() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Ignore and fallback to initial sample tickets
  }
  return [...initialTickets];
}

function savePersistedTickets(currentTickets) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(currentTickets, null, 2), 'utf-8');
  } catch (err) {
    // Silently continue if read-only or restricted
  }
}

let tickets = loadPersistedTickets();

export const store = {
  // Authors
  getAuthors: () => authors,
  getAuthorById: (id) => authors.find((a) => a.author_id === id),
  getAuthorByEmail: (email) =>
    authors.find((a) => a.email.toLowerCase() === email.toLowerCase()),

  // Admins
  getAdmins: () => adminUsers,
  getAdminByEmail: (email) =>
    adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),

  // Books
  getAllBooks: () => {
    const list = [];
    authors.forEach((author) => {
      author.books.forEach((book) => {
        list.push({
          ...book,
          author_id: author.author_id,
          author_name: author.name,
          author_email: author.email,
        });
      });
    });
    return list;
  },
  getBooksByAuthorId: (authorId) => {
    const author = authors.find((a) => a.author_id === authorId);
    return author ? author.books : [];
  },
  getBookById: (bookId) => {
    for (const author of authors) {
      const found = author.books.find((b) => b.book_id === bookId);
      if (found) {
        return {
          ...found,
          author_id: author.author_id,
          author_name: author.name,
          author_email: author.email,
        };
      }
    }
    return null;
  },

  // Tickets
  getAllTickets: (filters = {}) => {
    let result = [...tickets];

    if (filters.status && filters.status !== 'All') {
      result = result.filter((t) => t.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.category && filters.category !== 'All') {
      result = result.filter((t) => t.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.priority && filters.priority !== 'All') {
      result = result.filter((t) => t.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.authorId) {
      result = result.filter((t) => t.authorId === filters.authorId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.authorName.toLowerCase().includes(q) ||
          (t.bookTitle && t.bookTitle.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q)
      );
    }

    // Default sort: Critical/High first, then oldest unresolved first
    result.sort((a, b) => {
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const statusWeight = (s) => (s === 'Resolved' || s === 'Closed' ? 0 : 1);

      // Unresolved tickets first
      const statusDiff = statusWeight(b.status) - statusWeight(a.status);
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const pDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      if (pDiff !== 0) return pDiff;

      // Then oldest first for unresolved
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return result;
  },

  getTicketsByAuthorId: (authorId) => {
    const author = authors.find((a) => a.author_id === authorId || a.id === authorId);
    const authorEmail = author?.email?.toLowerCase();
    return tickets
      .filter((t) => {
        const idMatch =
          t.authorId === authorId ||
          t.author_id === authorId ||
          (t.authorId && authorId && t.authorId.toLowerCase() === authorId.toLowerCase());
        const emailMatch =
          authorEmail && t.authorEmail && t.authorEmail.toLowerCase() === authorEmail;
        return idMatch || emailMatch;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getTicketById: (ticketId) => {
    return tickets.find((t) => t.id === ticketId);
  },

  createTicket: (ticketData) => {
    const id = `TICK-${1000 + tickets.length + 1}`;
    const now = new Date().toISOString();
    const newTicket = {
      id,
      authorId: ticketData.authorId,
      authorName: ticketData.authorName,
      authorEmail: ticketData.authorEmail,
      bookId: ticketData.bookId || null,
      bookTitle: ticketData.bookTitle || 'General / Account Level',
      category: ticketData.category || 'General Inquiry',
      priority: ticketData.priority || 'Medium',
      status: 'Open',
      subject: ticketData.subject,
      description: ticketData.description,
      createdAt: now,
      updatedAt: now,
      assignedTo: null,
      aiClassification: ticketData.aiClassification || {
        category: ticketData.category || 'General Inquiry',
        priority: ticketData.priority || 'Medium',
        confidence: 0.9,
        reasoning: 'Auto-classified on ticket intake.',
      },
      aiDraftResponse: ticketData.aiDraftResponse || '',
      responses: [],
      internalNotes: [],
      attachments: ticketData.attachments || [],
    };

    tickets.unshift(newTicket);
    savePersistedTickets(tickets);
    return newTicket;
  },

  updateTicket: (ticketId, updates) => {
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) return null;

    tickets[index] = {
      ...tickets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    savePersistedTickets(tickets);
    return tickets[index];
  },

  deleteTicket: (ticketId) => {
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) return false;
    tickets.splice(index, 1);
    savePersistedTickets(tickets);
    return true;
  },

  addTicketResponse: (ticketId, responseData) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const response = {
      id: `RESP-${uuidv4().slice(0, 8)}`,
      senderRole: responseData.senderRole, // 'admin' | 'author'
      senderName: responseData.senderName,
      senderEmail: responseData.senderEmail,
      message: responseData.message,
      createdAt: new Date().toISOString(),
    };

    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    // Auto-update ticket status when admin responds
    if (responseData.senderRole === 'admin' && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    savePersistedTickets(tickets);
    return { ticket, response };
  },

  addTicketInternalNote: (ticketId, noteData) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const note = {
      id: `NOTE-${uuidv4().slice(0, 8)}`,
      authorEmail: noteData.authorEmail,
      authorName: noteData.authorName,
      content: noteData.content,
      createdAt: new Date().toISOString(),
    };

    ticket.internalNotes.push(note);
    ticket.updatedAt = new Date().toISOString();
    savePersistedTickets(tickets);
    return { ticket, note };
  },

  syncClientTickets: (clientTickets) => {
    if (!Array.isArray(clientTickets)) return;
    clientTickets.forEach((ct) => {
      if (!ct || !ct.id) return;
      const idx = tickets.findIndex((t) => t.id === ct.id);
      if (idx === -1) {
        tickets.unshift(ct);
      } else {
        const existing = tickets[idx];
        const respMap = new Map();
        (existing.responses || []).forEach((r) => respMap.set(r.id, r));
        (ct.responses || []).forEach((r) => respMap.set(r.id, r));
        const mergedResp = Array.from(respMap.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        const noteMap = new Map();
        (existing.internalNotes || []).forEach((n) => noteMap.set(n.id, n));
        (ct.internalNotes || []).forEach((n) => noteMap.set(n.id, n));
        const mergedNotes = Array.from(noteMap.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        tickets[idx] = {
          ...existing,
          ...ct,
          status: ct.status || existing.status,
          category: ct.category || existing.category,
          priority: ct.priority || existing.priority,
          assignedTo: ct.assignedTo !== undefined ? ct.assignedTo : existing.assignedTo,
          responses: mergedResp,
          internalNotes: mergedNotes,
          updatedAt: ct.updatedAt || new Date().toISOString(),
        };
      }
    });
    savePersistedTickets(tickets);
  },

  getStats: () => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Open').length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
    const critical = tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
    const high = tickets.filter((t) => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length;

    // Financial summaries
    let totalRoyaltyEarned = 0;
    let totalRoyaltyPaid = 0;
    let totalRoyaltyPending = 0;
    let totalCopiesSold = 0;

    authors.forEach((a) => {
      a.books.forEach((b) => {
        totalRoyaltyEarned += b.total_royalty_earned || 0;
        totalRoyaltyPaid += b.royalty_paid || 0;
        totalRoyaltyPending += b.royalty_pending || 0;
        totalCopiesSold += b.total_copies_sold || 0;
      });
    });

    return {
      tickets: {
        total,
        open,
        inProgress,
        resolved,
        critical,
        high,
      },
      catalog: {
        authorsCount: authors.length,
        booksCount: sampleData.authors.reduce((acc, a) => acc + a.books.length, 0),
        totalCopiesSold,
        totalRoyaltyEarned,
        totalRoyaltyPaid,
        totalRoyaltyPending,
      },
    };
  },

  resetStore: () => {
    tickets = [...initialTickets];
    savePersistedTickets(tickets);
  },
};
