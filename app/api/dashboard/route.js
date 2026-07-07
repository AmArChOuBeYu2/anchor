import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Common stop words excluded from topic analysis
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
  'over', 'under', 'again', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'and', 'but', 'or', 'if', 'it',
  'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'am', 'about', 'up', 'just', 'also',
  'hi', 'hello', 'hey', 'thanks', 'thank', 'please', 'yes', 'ok',
  'okay', 'sure', 'like', 'want', 'know', 'get', 'tell', 'us',
]);

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

function buildAnalytics(conversations, leads) {
  const days = 7;
  const analytics = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const convCount = (conversations || []).filter((c) => {
      const started = new Date(c.started_at);
      return started >= dayStart && started < dayEnd;
    }).length;

    const leadCount = (leads || []).filter((l) => {
      const created = new Date(l.created_at);
      return created >= dayStart && created < dayEnd;
    }).length;

    analytics.push({
      date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      conversations: convCount,
      leads: leadCount,
    });
  }

  return analytics;
}

/**
 * GET /api/dashboard
 * Returns dashboard metrics, conversations, leads, topics, analytics, documents.
 */
export async function GET() {
  try {
    const supabase = createClient();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      { count: conversationsToday, error: convTodayErr },
      { count: totalLeads, error: totalLeadsErr },
      { count: hotLeads, error: hotLeadsErr },
      { data: revenueRows, error: revenueErr },
      { data: recentConversations, error: recentConvErr },
      { data: todayMessages, error: todayMsgErr },
      { data: allLeads, error: allLeadsErr },
      { data: allConversations, error: allConvErr },
      { data: documents, error: docsErr },
    ] = await Promise.all([
      supabase.from('conversations').select('id', { count: 'exact', head: true }).gte('started_at', todayStart),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('buying_probability', 'high'),
      supabase.from('leads').select('estimated_revenue'),
      supabase.from('conversations').select('id, customer_identifier, started_at').order('started_at', { ascending: false }).limit(20),
      supabase.from('messages').select('content, conversation_id').eq('role', 'user').gte('created_at', todayStart),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('conversations').select('id, started_at').order('started_at', { ascending: false }),
      supabase.from('documents').select('id, filename, uploaded_at').order('uploaded_at', { ascending: false }),
    ]);

    if (convTodayErr) console.error('[dashboard] conversationsToday error:', convTodayErr);
    if (totalLeadsErr) console.error('[dashboard] totalLeads error:', totalLeadsErr);
    if (hotLeadsErr) console.error('[dashboard] hotLeads error:', hotLeadsErr);
    if (revenueErr) console.error('[dashboard] revenue error:', revenueErr);
    if (recentConvErr) console.error('[dashboard] recentConversations error:', recentConvErr);
    if (todayMsgErr) console.error('[dashboard] todayMessages error:', todayMsgErr);
    if (allLeadsErr) console.error('[dashboard] allLeads error:', allLeadsErr);
    if (allConvErr) console.error('[dashboard] allConv error:', allConvErr);
    if (docsErr) console.error('[dashboard] documents error:', docsErr);

    const totalRevenue = (revenueRows || []).reduce(
      (sum, row) => sum + (parseFloat(row.estimated_revenue) || 0),
      0
    );

    const leads = (allLeads || []).map(mapLead);

    const enrichedConversations = [];

    for (const conv of recentConversations || []) {
      const { count: messageCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      const { data: leadData } = await supabase
        .from('leads')
        .select('name, phone, intent, buying_probability, urgency, estimated_revenue, recommended_action, interested_product')
        .eq('conversation_id', conv.id)
        .limit(1)
        .maybeSingle();

      enrichedConversations.push({
        id: conv.id,
        conversationId: conv.id,
        customerIdentifier: conv.customer_identifier,
        startedAt: conv.started_at,
        customerName: leadData?.name || null,
        messageCount: messageCount || 0,
        hasLead: !!leadData,
        lead: leadData ? mapLead({ ...leadData, id: null, conversation_id: conv.id }) : null,
      });
    }

    const wordFreq = {};
    for (const msg of todayMessages || []) {
      const words = msg.content
        .toLowerCase()
        .replace(/[^a-z0-9\s₹]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      for (const word of words) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    const topics = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const analytics = buildAnalytics(allConversations, allLeads);

    const documentList = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count } = await supabase
          .from('document_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', doc.id);

        return {
          id: doc.id,
          filename: doc.filename,
          name: doc.filename,
          uploadedAt: doc.uploaded_at,
          chunks: count || 0,
        };
      })
    );

    return NextResponse.json({
      metrics: {
        totalChats: conversationsToday || 0,
        leadsCaptured: totalLeads || 0,
        hotLeads: hotLeads || 0,
        revenuePotential: totalRevenue,
      },
      conversations: enrichedConversations,
      leads,
      topics,
      analytics,
      documents: documentList,
      // Legacy fields for backwards compatibility
      conversationsToday: conversationsToday || 0,
      totalLeads: totalLeads || 0,
      totalRevenue,
      recentConversations: enrichedConversations,
      topTopics: topics,
    });
  } catch (error) {
    console.error('[dashboard] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
