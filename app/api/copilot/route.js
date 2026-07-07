import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { ownerCopilot } from '@/lib/gemini';

/**
 * POST /api/copilot
 *
 * Owner/manager AI assistant. Loads today's business data, builds a context
 * summary, and answers the owner's question with actionable insights.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Missing "question" field' }, { status: 400 });
    }

    const supabase = createClient();

    // Today's date boundaries (UTC)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // --- Load today's conversations ---------------------------------------
    const { data: todayConversations, error: convErr } = await supabase
      .from('conversations')
      .select('id, customer_identifier, started_at')
      .gte('started_at', todayStart)
      .order('started_at', { ascending: false });

    if (convErr) console.error('[copilot] conversations error:', convErr);

    const conversations = todayConversations || [];

    // --- Load all leads ---------------------------------------------------
    const { data: allLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsErr) console.error('[copilot] leads error:', leadsErr);

    const leads = allLeads || [];

    // --- Load today's messages for common-question analysis ---------------
    const { data: todayMessages, error: msgErr } = await supabase
      .from('messages')
      .select('role, content')
      .eq('role', 'user')
      .gte('created_at', todayStart);

    if (msgErr) console.error('[copilot] messages error:', msgErr);

    const userMessages = todayMessages || [];

    // --- Build context summary -------------------------------------------
    const totalRevenue = leads.reduce((sum, l) => sum + (parseFloat(l.estimated_revenue) || 0), 0);
    const hotLeads = leads.filter((l) => l.buying_probability === 'high');
    const mediumLeads = leads.filter((l) => l.buying_probability === 'medium');

    let contextParts = [];

    // Overview
    contextParts.push(`TODAY'S OVERVIEW (${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}):`);
    contextParts.push(`- Total conversations today: ${conversations.length}`);
    contextParts.push(`- Total leads in pipeline: ${leads.length}`);
    contextParts.push(`- Hot leads (high buying probability): ${hotLeads.length}`);
    contextParts.push(`- Medium leads: ${mediumLeads.length}`);
    contextParts.push(`- Total revenue pipeline: ₹${totalRevenue.toLocaleString('en-IN')}`);
    contextParts.push('');

    // Lead details
    if (leads.length > 0) {
      contextParts.push('LEAD DETAILS:');
      for (const lead of leads.slice(0, 20)) {
        contextParts.push(
          `- ${lead.name || 'Unknown'} | Phone: ${lead.phone || 'N/A'} | ` +
          `Intent: ${lead.intent || 'N/A'} | Product: ${lead.interested_product || 'N/A'} | ` +
          `Probability: ${lead.buying_probability} | Urgency: ${lead.urgency} | ` +
          `Est. Revenue: ₹${(parseFloat(lead.estimated_revenue) || 0).toLocaleString('en-IN')} | ` +
          `Action: ${lead.recommended_action || 'N/A'} | ` +
          `Created: ${new Date(lead.created_at).toLocaleDateString('en-IN')}`
        );
      }
      contextParts.push('');
    }

    // Common questions today
    if (userMessages.length > 0) {
      contextParts.push('COMMON CUSTOMER QUESTIONS TODAY:');
      // Show up to 15 most recent customer messages
      for (const msg of userMessages.slice(0, 15)) {
        contextParts.push(`- "${msg.content}"`);
      }
      contextParts.push('');
    }

    const dataContext = contextParts.join('\n');

    // --- Call Gemini owner copilot ----------------------------------------
    const aiAnswer = await ownerCopilot(question, dataContext);

    if (aiAnswer) {
      return NextResponse.json({ answer: aiAnswer });
    }

    // --- Fallback: return a simple data summary ---------------------------
    const fallbackAnswer = [
      `Here's a quick summary of your business data:`,
      '',
      `📊 **Today's Activity:**`,
      `- ${conversations.length} conversation${conversations.length !== 1 ? 's' : ''} today`,
      `- ${leads.length} total lead${leads.length !== 1 ? 's' : ''} in pipeline`,
      `- ${hotLeads.length} hot lead${hotLeads.length !== 1 ? 's' : ''} requiring immediate attention`,
      `- ₹${totalRevenue.toLocaleString('en-IN')} total revenue potential`,
      '',
    ];

    if (hotLeads.length > 0) {
      fallbackAnswer.push(`🔥 **Hot Leads:**`);
      for (const lead of hotLeads) {
        fallbackAnswer.push(
          `- ${lead.name || 'Unknown'}: ${lead.interested_product || lead.intent || 'General inquiry'} (₹${(parseFloat(lead.estimated_revenue) || 0).toLocaleString('en-IN')})`
        );
      }
      fallbackAnswer.push('');
    }

    fallbackAnswer.push(
      `_(Note: AI analysis is temporarily unavailable. This is a raw data summary.)_`
    );

    return NextResponse.json({ answer: fallbackAnswer.join('\n') });
  } catch (error) {
    console.error('[copilot] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
