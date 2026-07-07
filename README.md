# Anchor — The AI Employee every small business can rely on

Anchor is an "AI Employee" designed specifically for small businesses—using a fine-dining restaurant (**Indian Accent, New Delhi**) as the demo vertical. 

Anchor is not just a simple FAQ chatbot. It is an end-to-end customer support, lead generation, and business intelligence platform built for a 24-hour hackathon, designed with a ₹0 budget constraint.

---

## 🌟 Core Features

1. **Document-Guided Customer Chat (RAG)**
   - Answers customer questions about menus, timings, dress code, reservations, and policies using the restaurant's uploaded documents.
   - Dual retrieval pipeline: semantic cosine similarity search using Gemini embeddings, with an automatic TF-IDF-lite keyword fallback if Gemini API is offline or rate-limited.

2. **Automated Lead Capture**
   - Automatically detects contact sharing (phone numbers) and booking intent (keywords like "reserve", "party", "catering") in real-time.
   - Saves lead records under the owner dashboard with initial parameters.

3. **Intelligent Lead Qualification**
   - A separate background Gemini process analyzes completed customer transcripts.
   - Returns a structured JSON summary evaluating:
     - Customer Intent
     - Interested Product/Service
     - Buying Probability (Low/Medium/High)
     - Urgency (Low/Medium/High)
     - Recommended next steps for the owner
     - Estimated revenue potential (in INR)

4. **Premium Owner Dashboard**
   - Glassmorphic SaaS dashboard interface displaying high-level key metrics (total chats, total leads, hot leads, estimated revenue).
   - Word frequency analysis displaying the day's top customer topics/questions.
   - Full conversation history with relative timestamps and clickable transcript drill-downs showing lead details.
   - Document knowledge base showing uploaded documents with a text paste area and file upload panel.

5. **Owner Copilot**
   - A natural-language interface allowing the owner to query the day's conversation logs and leads data directly (e.g., *"What did customers ask about today?"* or *"Who are my hot leads?"*).
   - Generates quick, actionable summaries.

6. **Micro-interactions & UX Polish**
   - Pulsing floating chat widget.
   - Typing bounce dots indicator.
   - Fake "WhatsApp confirmation sent ✓" toast notifications upon lead capture.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, JavaScript)
- **Styling:** Tailwind CSS v4 (Glassmorphic dark design system)
- **Database:** Supabase (PostgreSQL)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash` for generation & reasoning, `gemini-embedding-001` for semantic search)
- **UI Components:** Lucide Icons & Recharts for analytics
- **Deployment:** Vercel

---

## 💾 Database Schema

Run this script in the **Supabase SQL Editor** to create the required tables and indexes:

```sql
-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  filename TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Document chunks table (stores text segments and float array embeddings)
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding JSONB, -- JSON array of floats
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  customer_identifier TEXT,
  started_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads table (stores captured contact info and qualification parameters)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  conversation_id UUID REFERENCES conversations(id),
  name TEXT,
  phone TEXT,
  intent TEXT,
  interested_product TEXT,
  buying_probability TEXT DEFAULT 'medium',
  urgency TEXT DEFAULT 'medium',
  recommended_action TEXT,
  estimated_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for quick querying
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_leads_conversation_id ON leads(conversation_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);
CREATE INDEX idx_leads_buying_probability ON leads(buying_probability);
```

---

## 🚀 Local Setup Instructions

### 1. Clone the project and install dependencies
```bash
cd anchor
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Setup Demo Data (Optional but Recommended)
A sample menu / restaurant guide document has been pre-created under `data/sample-menu.txt` with realistic menu prices, timings, private event room rates, cancellation policies, and address info for **Indian Accent**.
You can upload this document via the **Documents** tab in the Owner Dashboard to initialize the knowledge base.

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to:
- Customer Landing Page & Chat Widget: `http://localhost:3000`
- Owner Dashboard: `http://localhost:3000/dashboard`

---

## ⚡ Reliability & Error Fallbacks

- **Embedding & Gemini API Failures:** If the Google Gemini embeddings or generation APIs fail (due to rate-limits or network issues), the chat widget falls back to a TF-IDF-lite keyword search over the stored chunks to display the closest match directly.
- **Lead Qualification Failures:** If the structured JSON qualification call fails, the lead is safely captured with default values ("medium" probability, "unknown" intent) to ensure the client is never lost.
