import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

/**
 * Generate an embedding vector for a piece of text using gemini-embedding-001.
 * @param {string} text — The text to embed.
 * @returns {Promise<number[]|null>} Float array or null on failure.
 */
export async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('[gemini] generateEmbedding called with empty text');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    if (!embedding || !embedding.values || embedding.values.length === 0) {
      console.warn('[gemini] embedContent returned empty embedding');
      return null;
    }

    return embedding.values;
  } catch (error) {
    console.error('[gemini] generateEmbedding error:', error.message || error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Chat / RAG answer generation
// ---------------------------------------------------------------------------

/**
 * Generate an answer using gemini-2.5-flash with system prompt, context,
 * user question, and optional conversation history.
 *
 * @param {string} systemPrompt — System-level instruction.
 * @param {string} context — Document context (RAG chunks).
 * @param {string} question — The user's current question.
 * @param {Array<{role:string, content:string}>} conversationHistory — Previous messages.
 * @returns {Promise<string|null>} Generated text or null on failure.
 */
export async function generateAnswer(systemPrompt, context, question, conversationHistory = []) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    // Build the message history for the multi-turn chat.
    // Gemini expects alternating user / model roles.
    const history = [];

    for (const msg of conversationHistory) {
      const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
      history.push({
        role: geminiRole,
        parts: [{ text: msg.content }],
      });
    }

    const chat = model.startChat({ history });

    // Compose the current turn: context + question
    const userMessage = `Here is relevant context from our restaurant documents:\n\n---\n${context}\n---\n\nCustomer question: ${question}`;

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.warn('[gemini] generateAnswer returned empty text');
      return null;
    }

    return text.trim();
  } catch (error) {
    console.error('[gemini] generateAnswer error:', error.message || error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lead qualification
// ---------------------------------------------------------------------------

/**
 * Analyse a conversation transcript and return structured lead data.
 *
 * @param {string} conversationTranscript — Full conversation text.
 * @returns {Promise<object>} Parsed JSON object with lead fields, or defaults.
 */
export async function qualifyLead(conversationTranscript) {
  const defaults = {
    intent: 'unknown',
    interested_product: 'unknown',
    buying_probability: 'medium',
    urgency: 'medium',
    recommended_action: 'Follow up with customer',
    estimated_revenue: 0,
  };

  try {
    const { LEAD_QUALIFICATION_PROMPT } = await import('./prompts.js');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: LEAD_QUALIFICATION_PROMPT,
    });

    const result = await model.generateContent(
      `Here is the conversation transcript:\n\n${conversationTranscript}`
    );

    const response = result.response;
    let text = response.text();

    if (!text || text.trim().length === 0) {
      console.warn('[gemini] qualifyLead returned empty text');
      return defaults;
    }

    // Strip markdown code fences if Gemini wraps the JSON
    text = text.trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    text = text.trim();

    const parsed = JSON.parse(text);

    // Merge with defaults so every field is guaranteed to exist
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error('[gemini] qualifyLead error:', error.message || error);
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Owner copilot
// ---------------------------------------------------------------------------

/**
 * Answer an owner/manager question given a business data context.
 *
 * @param {string} question — The owner's question.
 * @param {string} dataContext — Aggregated business data summary.
 * @returns {Promise<string|null>} AI-generated answer or null.
 */
export async function ownerCopilot(question, dataContext) {
  try {
    const { OWNER_COPILOT_PROMPT } = await import('./prompts.js');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: OWNER_COPILOT_PROMPT,
    });

    const userMessage = `Here is today's business data:\n\n${dataContext}\n\nOwner's question: ${question}`;

    const result = await model.generateContent(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.warn('[gemini] ownerCopilot returned empty text');
      return null;
    }

    return text.trim();
  } catch (error) {
    console.error('[gemini] ownerCopilot error:', error.message || error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Contact Info Extraction (LLM-based)
// ---------------------------------------------------------------------------

/**
 * Extract name and phone from a customer message using Gemini's structured JSON output mode.
 *
 * @param {string} message - The current message from the user.
 * @returns {Promise<{name: string|null, phone: string|null}>}
 */
export async function extractContactInfo(message) {
  const defaults = { name: null, phone: null };
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze this customer message and extract the customer's name and phone number if present.
Return ONLY a valid JSON object in this exact format:
{
  "name": "extracted name (string or null)",
  "phone": "extracted phone number as digits/string (string or null)"
}

Do not add markdown formatting, do not write explanations.
Message: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    if (!text || text.trim().length === 0) return defaults;

    text = text.trim();
    // Strip markdown code blocks just in case
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(text);
    return {
      name: parsed.name && parsed.name !== 'null' ? parsed.name : null,
      phone: parsed.phone && parsed.phone !== 'null' ? parsed.phone : null,
    };
  } catch (error) {
    console.error('[gemini] extractContactInfo error:', error.message || error);
    return defaults;
  }
}

