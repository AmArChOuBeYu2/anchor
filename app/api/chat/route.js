import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { generateEmbedding, generateAnswer, qualifyLead, extractContactInfo } from '@/lib/gemini';
import { findRelevantChunks, keywordFallback } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

// Indian phone number regex — matches 10-digit numbers with optional +91 / 0 prefix
const PHONE_REGEX = /(?:\+91[\s-]?)?(?:0)?[6-9]\d{9}\b/;

// Keywords that signal booking / purchase intent
const INTENT_KEYWORDS = [
  'book', 'reserve', 'reservation', 'order', 'party',
  'birthday', 'anniversary', 'event', 'catering',
  'table', 'private dining', 'banquet',
];

/**
 * POST /api/chat
 *
 * Core RAG chat endpoint. Handles conversation management, retrieval,
 * generation, and lead capture.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;
    let { conversationId } = body;

    // --- Validate input ---------------------------------------------------
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Missing "message" field' }, { status: 400 });
    }

    const supabase = createClient();

    // --- Create or verify conversation ------------------------------------
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (conversationId && !uuidRegex.test(conversationId)) {
      conversationId = null;
    }

    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!existingConv) {
        conversationId = null;
      }
    }

    if (!conversationId) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (convError) {
        console.error('[chat] Failed to create conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation', details: convError.message },
          { status: 500 }
        );
      }
      conversationId = conv.id;
    }

    // --- Store the user message -------------------------------------------
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'user', content: message.trim() });

    if (userMsgError) {
      console.error('[chat] Failed to store user message:', userMsgError);
    }

    // --- Load conversation history (last 10 messages) ---------------------
    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Exclude the message we just inserted (it's the last one)
    const conversationHistory = (historyRows || []).slice(0, -1);

    // --- Lead detection & extraction (Run before generation) --------------
    let leadCaptured = false;
    let extractedPhone = null;
    let extractedName = null;

    const messageLower = message.toLowerCase();
    const phoneMatch = message.match(PHONE_REGEX);
    const hasIntentKeyword = INTENT_KEYWORDS.some((kw) => messageLower.includes(kw));

    if (phoneMatch || hasIntentKeyword) {
      leadCaptured = true;

      // Extract details using Gemini LLM (highly reliable on freeform text)
      const extracted = await extractContactInfo(message);
      extractedName = extracted.name;
      extractedPhone = extracted.phone || (phoneMatch ? phoneMatch[0] : null);

      // Check if a lead already exists for this conversation
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, name, phone, intent')
        .eq('conversation_id', conversationId)
        .limit(1);

      const leadData = {
        conversation_id: conversationId,
        name: extractedName || (existingLeads?.[0]?.name) || null,
        phone: extractedPhone || (existingLeads?.[0]?.phone) || null,
        intent: hasIntentKeyword ? messageLower : (existingLeads?.[0]?.intent || 'general inquiry'),
      };

      if (existingLeads && existingLeads.length > 0) {
        // Update existing lead with new non-null fields
        const updateFields = {};
        if (leadData.name) updateFields.name = leadData.name;
        if (leadData.phone) updateFields.phone = leadData.phone;
        if (hasIntentKeyword) updateFields.intent = leadData.intent;

        if (Object.keys(updateFields).length > 0) {
          await supabase
            .from('leads')
            .update(updateFields)
            .eq('id', existingLeads[0].id);
        }
      } else {
        // Create new lead
        await supabase.from('leads').insert(leadData);
      }
    }

    // --- Load current lead state from database ----------------------------
    const { data: currentLead } = await supabase
      .from('leads')
      .select('name, phone')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    // --- Load document chunks from Supabase ------------------------------
    const { data: allChunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_text, embedding');

    if (chunksError) {
      console.error('[chat] Failed to load chunks:', chunksError);
    }

    const chunks = allChunks || [];

    // --- Retrieve relevant context ----------------------------------------
    let relevantChunks = [];
    let usedFallback = false;

    const queryEmbedding = await generateEmbedding(message);

    if (queryEmbedding && chunks.length > 0) {
      relevantChunks = findRelevantChunks(queryEmbedding, chunks, 5);
    } else if (chunks.length > 0) {
      usedFallback = true;
      relevantChunks = keywordFallback(message, chunks, 3);
    }

    // Build context string
    let contextStr =
      relevantChunks.length > 0
        ? relevantChunks.map((c, i) => `[Source ${i + 1}] ${c.chunk_text}`).join('\n\n')
        : 'No relevant documents found.';

    // Inject current lead status into context to guide Gemini behavior
    if (currentLead && (currentLead.name || currentLead.phone)) {
      const clientStateStr = `[Customer Info Status] Name: ${currentLead.name || 'Unknown'}, Phone: ${currentLead.phone || 'N/A'}. (Do NOT ask for their contact details again as we already have them. Acknowledge receipt of this info if they just shared it by thanking them by name.)`;
      contextStr = `${contextStr}\n\n${clientStateStr}`;
    }

    // --- Generate AI response ---------------------------------------------
    let responseText = await generateAnswer(
      CHAT_SYSTEM_PROMPT,
      contextStr,
      message,
      conversationHistory
    );

    // Fallback if Gemini fails
    if (!responseText) {
      if (relevantChunks.length > 0) {
        responseText =
          "I'm having a little trouble right now, but here's what I found from our information:\n\n" +
          relevantChunks[0].chunk_text +
          '\n\nPlease feel free to call us directly for more details!';
      } else {
        responseText =
          "I apologize, but I'm experiencing some technical difficulties at the moment. " +
          'Please try again in a moment, or feel free to call us directly at the restaurant.';
      }
    }

    // --- Store the assistant response -------------------------------------
    const { error: asstMsgError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'assistant', content: responseText });

    if (asstMsgError) {
      console.error('[chat] Failed to store assistant message:', asstMsgError);
    }

    // --- Trigger async lead qualification (runs in background) -----------
    if (leadCaptured || currentLead) {
      const { data: fullHistory } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fullHistory && fullHistory.length > 0) {
        const transcript = fullHistory
          .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
          .join('\n');

        qualifyLead(transcript)
          .then(async (qualification) => {
            if (qualification) {
              const { data: leadToUpdate } = await supabase
                .from('leads')
                .select('id')
                .eq('conversation_id', conversationId)
                .limit(1)
                .single();

              if (leadToUpdate) {
                await supabase
                  .from('leads')
                  .update({
                    intent: qualification.intent,
                    interested_product: qualification.interested_product,
                    buying_probability: qualification.buying_probability,
                    urgency: qualification.urgency,
                    recommended_action: qualification.recommended_action,
                    estimated_revenue: qualification.estimated_revenue,
                  })
                  .eq('id', leadToUpdate.id);
              }
            }
          })
          .catch((err) => {
            console.error('[chat] Lead qualification background error:', err);
          });
      }
    }

    const finalPhone = extractedPhone || (currentLead?.phone) || (phoneMatch ? phoneMatch[0] : null);

    return NextResponse.json({
      response: responseText,
      conversationId,
      leadCaptured: leadCaptured || !!currentLead,
      ...(finalPhone && { phone: finalPhone }),
      ...(usedFallback && { note: 'Used keyword fallback — embedding API was unavailable' }),
    });
  } catch (error) {
    console.error('[chat] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

