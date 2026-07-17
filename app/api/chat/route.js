import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { generateEmbedding, generateAnswer, qualifyLead, extractContactInfo } from '@/lib/gemini';
import { findRelevantChunks, keywordFallback } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

// Flexible phone number regex — matches 8-14 digit number blocks (crucial for demo inputs like 1345463313)
const PHONE_REGEX = /\b\d{8,14}\b/;

// Keywords that signal booking / purchase intent
const INTENT_KEYWORDS = [
  'book', 'reserve', 'reservation', 'order', 'party',
  'birthday', 'anniversary', 'event', 'catering',
  'table', 'private dining', 'banquet',
];

/**
 * Clean raw document chunks to strip out markdown syntax, list prefixes, 
 * and formatting dividers so it reads like a standard conversational sentence.
 */
function cleanChunkText(text) {
  if (!text) return "";
  return text
    .split('\n')
    // Remove lines that are just dividers like === or ---
    .filter(line => !/^[=\-\s#_*]+$/.test(line))
    .map(line => {
      // Remove leading bullets, numbers, headers, and Q:/A: markers
      return line
        .replace(/^[\s*\-\•\d\.\:\)\(]+(Q:|A:)?\s*/i, '')
        .trim();
    })
    .filter(line => line.length > 0)
    .join(' ');
}


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
    let customerIdentifier = null;

    // If conversationId is provided but is not a valid UUID (e.g., whatsapp phone/contact id),
    // treat it as the customerIdentifier and resolve it to a DB conversation UUID.
    if (conversationId && !uuidRegex.test(conversationId)) {
      customerIdentifier = conversationId;
      conversationId = null;
    }

    if (customerIdentifier) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_identifier', customerIdentifier)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ customer_identifier: customerIdentifier })
          .select('id')
          .single();

        if (convError) {
          console.error('[chat] Failed to create customer conversation:', convError);
          return NextResponse.json(
            { error: 'Failed to create customer conversation', details: convError.message },
            { status: 500 }
          );
        }
        conversationId = newConv.id;
      }
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

    // Check if a lead already exists for this conversation
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, name, phone, intent')
      .eq('conversation_id', conversationId)
      .limit(1);

    const hasExistingLead = existingLeads && existingLeads.length > 0;

    // Run extraction if there is a phone match, intent keyword, OR if this conversation already has an active lead
    if (phoneMatch || hasIntentKeyword || hasExistingLead) {
      const alreadyHasFullContact = hasExistingLead && existingLeads[0].name && existingLeads[0].phone;

      // Extract details if we don't have full contact info, or if a new phone number was explicitly matched
      if (phoneMatch || !alreadyHasFullContact) {
        const extracted = await extractContactInfo(message);
        extractedName = extracted.name;
        extractedPhone = extracted.phone || (phoneMatch ? phoneMatch[0] : null);
      }

      // If we successfully extracted any new information, or if we need to initialize a new lead
      if (extractedName || extractedPhone || hasIntentKeyword || !hasExistingLead) {
        leadCaptured = true;

        const leadData = {
          conversation_id: conversationId,
          name: extractedName || (existingLeads?.[0]?.name) || null,
          phone: extractedPhone || (existingLeads?.[0]?.phone) || null,
          intent: hasIntentKeyword ? messageLower : (existingLeads?.[0]?.intent || 'general inquiry'),
        };

        if (hasExistingLead) {
          // Update existing lead with new non-null fields
          const updateFields = {};
          if (extractedName) updateFields.name = extractedName;
          if (extractedPhone) updateFields.phone = extractedPhone;
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
        const cleanedChunk = cleanChunkText(relevantChunks[0].chunk_text);
        responseText = `Here's what I can tell you: ${cleanedChunk}. For booking details, please call us directly or leave your name and number and we'll follow up.`;
      } else {
        responseText =
          "I apologize, but I'm experiencing some technical difficulties at the moment. " +
          "For reservation or menu inquiries, please leave your name and number and someone from our team will get back to you shortly.";
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

