import { NextResponse } from 'next/server';

/**
 * POST /api/telegram-webhook
 *
 * Webhook receiver for Telegram Bot messages. Maps incoming Telegram chats
 * to our RAG pipeline and sends replies back via the Telegram Bot API.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Telegram sends message details inside the message object
    const messageText = body.message?.text;
    const chatId = body.message?.chat?.id;
    const firstName = body.message?.from?.first_name || '';

    // If there is no message text or chat ID, return 200 OK immediately
    if (!messageText || !chatId) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('[telegram-webhook] Missing TELEGRAM_BOT_TOKEN in environment variables.');
      return NextResponse.json({ success: true }, { status: 200 });
    }

    let botReply = '';

    // 1. Handle the Telegram "/start" command explicitly with a premium welcome message
    if (messageText.trim().toLowerCase() === '/start') {
      botReply = `Namaste${firstName ? ' ' + firstName : ''}! 🙏 Welcome to Indian Accent, New Delhi. I am Anchor, your AI Maître d'.\n\nI can help you with menu inquiries, table reservations, operating hours, dress codes, or private event bookings.\n\nHow may I assist you today?`;
    } else {
      // 2. Otherwise, forward the query to our existing RAG Chat API
      const host = request.headers.get('host');
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const chatUrl = `${protocol}://${host}/api/chat`;

      try {
        const chatResponse = await fetch(chatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            // Prefix the Telegram chatId so the DB automatically maps it to a unique WhatsApp/Telegram session
            conversationId: `telegram_${chatId}`
          })
        });

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          botReply = chatData.response;
        } else {
          console.error('[telegram-webhook] Chat API returned error status:', chatResponse.status);
        }
      } catch (chatErr) {
        console.error('[telegram-webhook] Failed to connect to RAG Chat API:', chatErr);
      }
    }

    // Default fallback reply if the generation API fails
    if (!botReply) {
      botReply = "I apologize, but I'm having trouble processing that right now. Please try again in a moment, or feel free to contact Indian Accent directly at +91 98711 17968.";
    }

    // 3. Send the reply back to the Telegram chat
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    
    try {
      const telegramRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: botReply
        })
      });

      if (!telegramRes.ok) {
        console.error('[telegram-webhook] Telegram API sendMessage failed:', telegramRes.status);
      }
    } catch (teleErr) {
      console.error('[telegram-webhook] Failed to send message to Telegram API:', teleErr);
    }

    // Always return 200 OK to Telegram to prevent them from retrying the request
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[telegram-webhook] Unexpected webhook execution error:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
