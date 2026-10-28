import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kbPath = path.join(__dirname, '../data/knowledge_base.json');
const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));

/**
 * Intelligent Knowledge Base Context Extractor
 * Solves Requirement D.4 (Cost Awareness & Token Optimization):
 * Rather than sending the entire knowledge base (~3,000+ tokens) on every call,
 * this service retrieves only the slice of policies relevant to the detected query category.
 */
export const knowledgeBaseService = {
  getRelevantContext(category, queryText = '', bookDetails = null) {
    const text = `${category} ${queryText}`.toLowerCase();
    const relevantSnippets = [];

    // Always include tone rules (compact)
    relevantSnippets.push(`COMPANY TONE GUIDELINES:
- Empathetic and professional; treat authors as publishing partners, not customers to be managed.
- Acknowledge author concerns upfront before providing details.
- Be specific with actual numbers, dates, and statuses.
- Own mistakes directly (no corporate deflection).
- Always conclude with a clear next step and realistic timeline.`);

    // Match policies based on category or query keywords
    const isRoyalty =
      category === 'Royalty & Payments' ||
      text.includes('royalt') ||
      text.includes('payout') ||
      text.includes('money') ||
      text.includes('bank') ||
      text.includes('threshold') ||
      text.includes('paid');

    const isISBN =
      category === 'ISBN & Metadata Issues' ||
      text.includes('isbn') ||
      text.includes('metadata') ||
      text.includes('imprint') ||
      text.includes('barcode') ||
      text.includes('bowker');

    const isPrinting =
      category === 'Printing & Quality' ||
      text.includes('print') ||
      text.includes('blur') ||
      text.includes('paper') ||
      text.includes('binding') ||
      text.includes('defect') ||
      text.includes('reprint') ||
      text.includes('copies');

    const isDistribution =
      category === 'Distribution & Availability' ||
      text.includes('distribut') ||
      text.includes('amazon') ||
      text.includes('flipkart') ||
      text.includes('unavailable') ||
      text.includes('listing') ||
      text.includes('stock');

    const isProduction =
      category === 'Book Status & Production Updates' ||
      text.includes('typeset') ||
      text.includes('cover') ||
      text.includes('proofread') ||
      text.includes('stage') ||
      text.includes('status') ||
      text.includes('progress') ||
      text.includes('timeline');

    if (isRoyalty) {
      relevantSnippets.push(`ROYALTY POLICY SLICE:
- Split: 80/20 (80% net profit to Author, 20% to BookLeaf).
- Formula: Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart ~45-50%), and shipping.
- Schedule: Calculated quarterly, paid within 45 days of the quarter ending.
- Threshold: ₹1,000 minimum payout. Amounts below roll over to next quarter.
- Mode: Bank transfer to linked account in Author Dashboard. Full line-by-line sales breakdown viewable on dashboard.`);
    }

    if (isISBN) {
      relevantSnippets.push(`ISBN POLICY SLICE:
- Registered under BookLeaf Publishing publisher imprint. If author wants personal imprint, must supply own ISBN.
- Discrepancy SLA: High-priority issue escalated immediately to production team with guaranteed 48-hour resolution.`);
    }

    if (isPrinting) {
      relevantSnippets.push(`PRINTING & QUALITY SLICE:
- Facilities: Delhi in-house printing & warehouse; overflow/specialty at Repro India & Epitome Books.
- Turnaround: 5–7 business days from order confirmation.
- Defects: Free reprint upon verification. Author must share photos of defective copies (misprints, spine/binding issues).`);
    }

    if (isDistribution) {
      relevantSnippets.push(`DISTRIBUTION POLICY SLICE:
- Live channels: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store.
- Listing SLA: 7–10 business days after publication.
- Out of Stock / "Currently Unavailable": Standard stock sync lag. BookLeaf triggers inventory re-sync within 24–48 hours.`);
    }

    if (isProduction) {
      relevantSnippets.push(`PRODUCTION WORKFLOW SLICE:
- Stages: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Most delays occur at Cover Design (waiting for author feedback) and Proofreading revision rounds.`);
    }

    // Book context token optimization
    if (bookDetails) {
      relevantSnippets.push(`RELEVANT BOOK CONTEXT:
- Title: "${bookDetails.title}"
- ISBN: ${bookDetails.isbn || 'Pending'}
- Current Status: ${bookDetails.status}
- MRP: ${bookDetails.mrp ? `₹${bookDetails.mrp}` : 'N/A'}
- Copies Sold: ${bookDetails.total_copies_sold ?? 0}
- Total Royalty Earned: ₹${bookDetails.total_royalty_earned ?? 0}
- Royalty Paid: ₹${bookDetails.royalty_paid ?? 0}
- Royalty Pending: ₹${bookDetails.royalty_pending ?? 0}
- Last Payout Date: ${bookDetails.last_royalty_payout_date || 'None'}
- Print Partner: ${bookDetails.print_partner || 'N/A'}`);
    }

    return relevantSnippets.join('\n\n');
  },

  getAllCategories() {
    return kbData.categories;
  },
};
