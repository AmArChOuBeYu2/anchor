import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

function mapLead(lead) {
  if (!lead) return null;
  return {
    id: lead.id,
    conversationId: lead.conversation_id,
    name: lead.name,
    phone: lead.phone,
    intent: lead.intent,
    product: lead.interested_product,
    interest: lead.interested_product,
    interested_product: lead.interested_product,
    probability: lead.buying_probability,
    buying_probability: lead.buying_probability,
    urgency: lead.urgency,
    action: lead.recommended_action,
    suggestedAction: lead.recommended_action,
    recommended_action: lead.recommended_action,
    revenue: parseFloat(lead.estimated_revenue) || 0,
    estimatedRevenue: parseFloat(lead.estimated_revenue) || 0,
    estimated_revenue: parseFloat(lead.estimated_revenue) || 0,
    createdAt: lead.created_at,
  };
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation ID' }, { status: 400 });
    }

    // Validate UUID format to prevent database crash
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch conversation details
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (convErr) {
      console.error('[conversation-api] Fetch error:', convErr);
      return NextResponse.json({ error: 'Database error', details: convErr.message }, { status: 500 });
    }

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Fetch messages for the conversation
    const { data: messages, error: messagesErr } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (messagesErr) {
      console.error('[conversation-api] Messages fetch error:', messagesErr);
    }

    // 3. Fetch any lead associated with this conversation
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('conversation_id', id)
      .maybeSingle();

    if (leadErr) {
      console.error('[conversation-api] Lead fetch error:', leadErr);
    }

    return NextResponse.json({
      id: conv.id,
      conversationId: conv.id,
      customerIdentifier: conv.customer_identifier,
      startedAt: conv.started_at,
      createdAt: conv.started_at,
      messages: (messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
        created_at: m.created_at,
      })),
      lead: lead ? mapLead(lead) : null,
    });
  } catch (error) {
    console.error('[conversation-api] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
