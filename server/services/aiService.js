import { config } from '../config.js';
import { knowledgeBaseService } from './knowledgeBaseService.js';

const VALID_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Heuristic Rules-Based Classifier (Graceful Fallback & Deterministic Engine)
 * Runs when LLM API is unavailable, unconfigured, or rate-limited.
 */
function heuristicClassify(subject = '', description = '') {
  const text = `${subject} ${description}`.toLowerCase();

  // Category Detection
  let category = 'General Inquiry';
  let priority = 'Medium';
  let reasoning = 'Standard author support inquiry.';
  let confidence = 0.88;

  if (
    text.includes('isbn') ||
    text.includes('barcode') ||
    text.includes('metadata') ||
    text.includes('wrong book linked') ||
    text.includes('duplicate isbn')
  ) {
    category = 'ISBN & Metadata Issues';
    priority = 'Critical';
    confidence = 0.96;
    reasoning = 'Detected ISBN/metadata discrepancy on sales channels or book imprint. High catalog risk.';
  } else if (
    text.includes('royalt') ||
    text.includes('payout') ||
    text.includes('payment') ||
    text.includes('sold') && text.includes('earning') ||
    text.includes('bank') ||
    text.includes('commission') ||
    text.includes('neft')
  ) {
    category = 'Royalty & Payments';
    confidence = 0.95;
    if (text.includes('month') || text.includes('not received') || text.includes('never paid') || text.includes('delayed') || text.includes('missing')) {
      priority = 'High';
      reasoning = 'Author reports delayed or overdue royalty disbursement exceeding normal 45-day window.';
    } else {
      priority = 'Medium';
      reasoning = 'Author inquiry regarding net profit royalty formula or platform deductions breakdown.';
    }
  } else if (
    text.includes('print') ||
    text.includes('blur') ||
    text.includes('defect') ||
    text.includes('paper') ||
    text.includes('misalign') ||
    text.includes('author cop') ||
    text.includes('damage') ||
    text.includes('binding') ||
    text.includes('cover print')
  ) {
    category = 'Printing & Quality';
    confidence = 0.94;
    priority = 'High';
    reasoning = 'Author reports physical manufacturing or binding defect in author copies; triggers free reprint SLA.';
  } else if (
    text.includes('unavailable') ||
    text.includes('out of stock') ||
    text.includes('amazon') && text.includes('listing') ||
    text.includes('flipkart') ||
    text.includes('distribut') ||
    text.includes('cant buy') ||
    text.includes("can't find")
  ) {
    category = 'Distribution & Availability';
    confidence = 0.93;
    priority = 'Medium';
    reasoning = 'Listing reported as unavailable on retailer channel; standard stock sync issue.';
  } else if (
    text.includes('typeset') ||
    text.includes('cover design') ||
    text.includes('proofread') ||
    text.includes('manuscript') ||
    text.includes('stage') ||
    text.includes('when will it be done') ||
    text.includes('publish date') ||
    text.includes('in production')
  ) {
    category = 'Book Status & Production Updates';
    confidence = 0.92;
    priority = 'Medium';
    reasoning = 'Author requesting milestone timeline on book currently in production pipeline.';
  } else if (
    text.includes('bio') ||
    text.includes('update description') ||
    text.includes('blurb') ||
    text.includes('profile') ||
    text.includes('question')
  ) {
    category = 'General Inquiry';
    confidence = 0.91;
    priority = 'Low';
    reasoning = 'Routine general query or post-launch blurb/bio metadata update request.';
  }

  return { category, priority, confidence, reasoning };
}

/**
 * Grounded Response Generator (Knowledge Base Heuristic Fallback)
 * Formulates empathetic, specific, and policy-accurate BookLeaf responses
 * calibrated exactly on BookLeaf's tone guidelines.
 */
function heuristicDraftResponse({ subject = '', description = '', category, authorName = 'Author', bookDetails = null, tone = 'standard' }) {
  const text = `${subject} ${description}`.toLowerCase();
  const firstName = authorName ? authorName.split(' ')[0] : 'Author';
  const bookTitle = bookDetails?.title ? `"${bookDetails.title}"` : 'your title';

  if (category === 'Royalty & Payments') {
    if (text.includes('never') || text.includes('delayed') || text.includes('not received') || text.includes('months')) {
      const pendingAmount = bookDetails?.royalty_pending ? `₹${bookDetails.royalty_pending.toLocaleString('en-IN')}` : 'your pending royalty';
      return `Dear ${firstName},

I completely understand your frustration regarding the delay in receiving your royalties for ${bookTitle}, and I sincerely apologize for the inconvenience and anxiety this has caused. Authors are our true partners, and reliable payouts are our top commitment.

At BookLeaf, royalties are calculated on a quarterly cycle and disbursed within 45 days of the quarter ending. For payouts to trigger, your accumulated royalties must meet the ₹1,000 threshold and your bank account details must be verified.

According to our records, ${bookDetails?.royalty_pending ? `you currently have ${pendingAmount} pending disbursement.` : 'we are verifying your ledger status.'} I have flagged your account directly to our finance team for priority clearance within 48 hours.

Could you please double-check that your bank details and IFSC code under your Author Dashboard settings are complete? If everything is correct, we will send you the NEFT transfer confirmation receipt shortly.

Warm regards,
BookLeaf Royalty & Finance Team`;
    }

    return `Dear ${firstName},

Thank you for reaching out, and I appreciate the opportunity to explain how royalties are calculated for ${bookTitle}. Transparency is fundamental to how we work.

BookLeaf follows an 80/20 net profit split: 80% of net profit goes directly to you. Net profit is calculated as the book's MRP minus actual printing costs, marketplace platform commissions (typically 45–50% on Amazon/Flipkart), and shipping fees. 

${bookDetails?.author_royalty_per_copy ? `Your contract specifies an author royalty of approximately ₹${bookDetails.author_royalty_per_copy} per copy sold on standard retail channels.` : ''}

I would be more than happy to provide a comprehensive line-by-line sales and deduction breakdown for your recent sales. Our accounts desk will prepare this report and upload it to your dashboard within 24 hours.

Warm regards,
BookLeaf Author Success Team`;
  }

  if (category === 'ISBN & Metadata Issues') {
    return `Dear ${firstName},

Thank you for bringing this to our attention immediately. We treat any ISBN or listing metadata discrepancy with the highest priority, as accurate ISBN mapping is crucial for retailer discovery and sales accounting.

Because your book is registered under BookLeaf Publishing's official imprint, we have escalated this directly to our senior distribution & production team to conduct a metadata audit across Amazon and Bowker/Nielsen.

Our team will investigate the listing sync and correct the catalog linkage within 48 hours. We will follow up with you right here once the distributor catalog confirms the correct ISBN.

Warm regards,
BookLeaf Production & Operations Team`;
  }

  if (category === 'Printing & Quality') {
    return `Dear ${firstName},

We sincerely apologize for the poor print quality of your author copies for ${bookTitle}. We take great pride in our book production standards, and receiving blurry images or misaligned binding is unacceptable.

BookLeaf stands firmly behind our quality guarantee: we will arrange a complimentary reprint at zero cost to you.

To initiate the reprint with our Delhi printing plant, could you please share 2 to 3 photos showing the blurriness and binding misalignment? Once verified, our team will dispatch your replacement copies within 5 to 7 business days.

Warm regards,
BookLeaf Quality Assurance Team`;
  }

  if (category === 'Distribution & Availability') {
    return `Dear ${firstName},

Thank you for alerting us about the listing for ${bookTitle}.

When a published book unexpectedly appears as "Currently Unavailable" on Amazon or Flipkart, it is almost always a temporary stock inventory synchronization lag between our central warehouse and the retailer's catalog system.

Our distribution team has initiated an automated inventory re-sync with Amazon today. The listing typically normalizes and becomes orderable again within 24 to 48 hours. In the meantime, your title remains fully available on the BookLeaf Store.

We will monitor the listing and confirm as soon as it is back in active stock.

Warm regards,
BookLeaf Distribution Operations`;
  }

  if (category === 'Book Status & Production Updates') {
    const currentStatus = bookDetails?.status || 'In Production';
    return `Dear ${firstName},

Thank you for following up on the progress of ${bookTitle}. We understand how eager you are to see your book finalized and published!

Your title is currently in the ${currentStatus} stage of our 9-step production pipeline. Most production delays occur during Cover Design and Proofreading revision rounds as our creative teams refine details based on author feedback.

Our production team is actively working on your files. We will share your next milestone update and proof copy within 3 to 5 business days. Please feel free to check the production tracker on your dashboard for live milestone confirmations.

Warm regards,
BookLeaf Editorial & Production Team`;
  }

  // General Inquiry
  return `Dear ${firstName},

Thank you for reaching out to the BookLeaf team regarding ${bookTitle}.

Yes, you can certainly update your book metadata, author biography, and synopsis even after publication. Metadata updates can be submitted directly through your author dashboard or by replying to this ticket with your finalized text.

Once submitted, our distribution desk will transmit the updated metadata across Amazon India, Flipkart, and the BookLeaf Store, which typically reflects on platform listings within 3 to 5 business days.

Please let us know if you need any assistance finalizing the details!

Warm regards,
BookLeaf Author Support Team`;
}

export const aiService = {
  /**
   * Auto-classify incoming ticket into 1 of 6 categories with priority & confidence.
   */
  async classifyTicket({ subject, description, bookTitle = '' }) {
    // 1. Check if OpenAI API Key is present
    if (!config.openaiApiKey || config.openaiApiKey.startsWith('your_') || config.openaiApiKey.trim() === '') {
      return heuristicClassify(subject, description);
    }

    try {
      const prompt = `You are the AI triage assistant for BookLeaf Publishing.
Classify the following author support query into EXACTLY one category and assign an operational priority score.

Categories:
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

Priority Levels:
- Critical: Urgent catalog mismatch, wrong ISBN, legal, or severe financial escalation.
- High: Overdue royalty (>4 months), damaged/defective author copies, major launch block.
- Medium: Standard royalty breakdown inquiry, stock sync delay, production timeline questions.
- Low: General bio updates, simple questions, blurb tweaks.

Author Query:
Subject: ${subject}
Description: ${description}
Book: ${bookTitle || 'General / None'}

Respond with ONLY a valid JSON object matching this schema:
{
  "category": "string",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "confidence": number between 0.0 and 1.0,
  "reasoning": "brief 1-sentence explanation"
}`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.openaiModel,
          messages: [
            { role: 'system', content: 'You are a JSON-only response assistant for BookLeaf Publishing triage.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        console.warn(`[AI Service] OpenAI classify request failed with status ${res.status}. Falling back to heuristic.`);
        return heuristicClassify(subject, description);
      }

      const json = await res.json();
      const rawText = json.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);

      return {
        category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'General Inquiry',
        priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        reasoning: parsed.reasoning || 'Classified via BookLeaf AI model.',
      };
    } catch (err) {
      console.warn('[AI Service] Classification error, using resilient fallback:', err.message);
      return heuristicClassify(subject, description);
    }
  },

  /**
   * Generates a grounded, policy-accurate draft response based on query + knowledge base context.
   */
  async generateDraftResponse({ subject, description, category, authorName = 'Author', bookDetails = null, tone = 'standard' }) {
    // Contextual Token-Optimized Knowledge Base retrieval
    const kbContext = knowledgeBaseService.getRelevantContext(category, `${subject} ${description}`, bookDetails);

    if (!config.openaiApiKey || config.openaiApiKey.startsWith('your_') || config.openaiApiKey.trim() === '') {
      return heuristicDraftResponse({ subject, description, category, authorName, bookDetails, tone });
    }

    try {
      const systemPrompt = `You are a dedicated, empathetic Author Support Specialist at BookLeaf Publishing.
Draft a professional, clear, and helpful response to an author query using ONLY the verified BookLeaf policies below.

${kbContext}

RESPONSE RULES:
- Greet author by first name (${authorName.split(' ')[0] || 'Author'}).
- Empathetic and partner-oriented. Never deflect or blame the author.
- Cite specific numbers, policies, dates, and SLAs from the context.
- End with a concrete next step and timeline.
- Return ONLY the draft message body without placeholders or subject line.`;

      const userPrompt = `Author: ${authorName}
Book: ${bookDetails ? bookDetails.title : 'General / Account'}
Category: ${category}
Subject: ${subject}
Query: ${description}
Requested Tone: ${tone}`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 450,
        }),
      });

      if (!res.ok) {
        console.warn(`[AI Service] OpenAI draft request failed with status ${res.status}. Falling back to heuristic draft.`);
        return heuristicDraftResponse({ subject, description, category, authorName, bookDetails, tone });
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content?.trim() || heuristicDraftResponse({ subject, description, category, authorName, bookDetails, tone });
    } catch (err) {
      console.warn('[AI Service] Draft generation error, using resilient fallback:', err.message);
      return heuristicDraftResponse({ subject, description, category, authorName, bookDetails, tone });
    }
  },
};
