import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { qualifyLead } from '@/lib/gemini';

/**
 * POST /api/qualify
 *
 * Accepts { conversationId }, loads the full transcript, calls Gemini for
 * lead qualification, and updates the lead record.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing "conversationId"' }, { status: 400 });
    }

    const supabase = createClient();

    // --- Load full conversation transcript --------------------------------
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('[qualify] Failed to load messages:', msgError);
      return NextResponse.json(
        { error: 'Failed to load conversation', details: msgError.message },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found for this conversation' },
        { status: 404 }
      );
    }

    // Build transcript
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // --- Call Gemini for qualification ------------------------------------
    const qualification = await qualifyLead(transcript);

    // --- Update the lead record ------------------------------------------
    const { data: existingLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('id')
      .eq('conversation_id', conversationId)
      .limit(1)
      .single();

    if (leadFetchError && leadFetchError.code !== 'PGRST116') {
      // PGRST116 = "no rows returned" which is expected if no lead exists
      console.error('[qualify] Failed to fetch lead:', leadFetchError);
    }

    if (existingLead) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          intent: qualification.intent,
          interested_product: qualification.interested_product,
          buying_probability: qualification.buying_probability,
          urgency: qualification.urgency,
          recommended_action: qualification.recommended_action,
          estimated_revenue: qualification.estimated_revenue,
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('[qualify] Failed to update lead:', updateError);
        return NextResponse.json(
          { error: 'Failed to update lead', details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      // No lead record exists yet — create one with the qualification data
      const { error: insertError } = await supabase.from('leads').insert({
        conversation_id: conversationId,
        intent: qualification.intent,
        interested_product: qualification.interested_product,
        buying_probability: qualification.buying_probability,
        urgency: qualification.urgency,
        recommended_action: qualification.recommended_action,
        estimated_revenue: qualification.estimated_revenue,
      });

      if (insertError) {
        console.error('[qualify] Failed to insert lead:', insertError);
        return NextResponse.json(
          { error: 'Failed to create lead', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      conversationId,
      qualification,
    });
  } catch (error) {
    console.error('[qualify] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
