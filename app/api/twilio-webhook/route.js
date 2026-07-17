import { NextResponse } from 'next/server';

/**
 * POST /api/twilio-webhook
 *
 * Webhook receiver for Twilio WhatsApp Sandbox. Parses incoming form-data,
 * forwards to the RAG chat pipeline, and replies instantly using TwiML XML.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const messageText = formData.get('Body');
    const sender = formData.get('From'); // E.g., "whatsapp:+919876543210"

    // If there is no message text or sender, return an empty TwiML response
    if (!messageText || !sender) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Call our own `/api/chat` endpoint dynamically using the request host
    const host = request.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const chatUrl = `${protocol}://${host}/api/chat`;

    let botReply = '';
    try {
      const chatResponse = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          // Use the WhatsApp sender ID (e.g. "whatsapp:+919876543210") as the conversationId
          // This maps the chat logs and captured leads to this specific phone number session
          conversationId: sender
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        botReply = chatData.response;
      } else {
        console.error('[twilio-webhook] Chat API returned error status:', chatResponse.status);
      }
    } catch (chatErr) {
      console.error('[twilio-webhook] Failed to connect to RAG Chat API:', chatErr);
    }

    // Fallback reply if the generation API fails
    if (!botReply) {
      botReply = "I apologize, but I'm having trouble processing that right now. Please try again in a moment, or feel free to call us directly.";
    }

    // Return TwiML XML. Wrapping the bot reply in CDATA prevents XML syntax errors
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message><![CDATA[${botReply}]]></Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    console.error('[twilio-webhook] Webhook execution error:', error);
    // Return a friendly error message to the customer
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message><![CDATA[Sorry, I'm experiencing technical difficulties. Please try again shortly.]]></Message></Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml'
        }
      }
    );
  }
}
