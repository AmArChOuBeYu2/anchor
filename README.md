# Anchor — The AI Employee for Small Businesses (Restaurant Vertical)

**Anchor** is an AI Employee platform designed for customer support, lead generation, and business intelligence, built specifically for small businesses. For this hackathon demo, we built a showcase vertical for the fine-dining restaurant **Indian Accent, New Delhi**.

This project was built from scratch in 24 hours as a team submission for the **AI Automation & Intelligent Agents Hackathon**.

---

## 👥 The Team

We are a group of 4 students who collaborated to design, build, and deploy Anchor:

*   **Amar Choubey (Team Leader)**
    *   *Role:* Project Concept, System Architecture & RAG Pipeline Design
    *   *Contributions:* Formulated the system data flow, designed the database integration logic, and built the natural-language **Owner Copilot** API route.
*   **Kavya Chandravanshi (Member)**
    *   *Role:* Frontend & UI/UX Developer
    *   *Contributions:* Created the premium dark glassmorphism styling, built the responsive landing page, designed the customer chat widget, and wired up the Recharts dashboard analytics.
*   **Sudhanshu Kumar (Member)**
    *   *Role:* AI Integration & Fallback Engineer
    *   *Contributions:* Integrated the Google Gemini generative and embedding clients, built the asynchronous lead qualification prompt flow, and designed the TF-IDF-lite keyword search fallback mechanism.
*   **Parikshit Patidar (Member)**
    *   *Role:* Database Administrator & Ingestion Engineer
    *   *Contributions:* Engineered the Supabase PostgreSQL schema and indexing, built the Knowledge Base document chunking and sequential upload pipeline, and managed end-to-end integration testing.

---

## 💡 The Problem & Our Solution

Small businesses (like local restaurants) lose potential bookings and leads because they cannot answer customer questions 24/7 or follow up with interested prospects immediately. Traditional chatbots are either rigid button-based menus or general-knowledge conversational bots that hallucinate and can't capture structured leads.

**Anchor acts as a virtual employee:**
1.  **RAG Customer Chat Maître d'**: It talks to customers naturally, answering questions *only* using the business's official menu and FAQ document (ensuring no hallucinations).
2.  **Autonomous Lead Capture**: It extracts name and contact info automatically when a customer expresses booking interest.
3.  **Background Lead Qualification**: It automatically analyzes the customer chat transcript in the background using Gemini, scoring their buying probability, urgency, estimated revenue, and suggesting a specific callback action.
4.  **Owner Dashboard & Copilot**: The business owner sees metrics, a list of hot leads, and can chat with their dashboard using natural language (*"What did customers ask about today?"*) to get quick insights.

---

## 🛠️ Tech Stack & Design Choices

*   **Frontend & Backend:** Next.js (App Router, JavaScript)
*   **Database:** Supabase (PostgreSQL)
*   **Styling:** Tailwind CSS v4 (Glassmorphic dark design system with custom animations)
*   **AI Integration:** Google Gemini API (`gemini-2.5-flash` for conversational tasks and lead qualification, `gemini-embedding-001` for vector embedding generation)
*   **Data Visualization:** Recharts (responsive analytics area charts)
*   **API / UI Library:** Lucide React (vector icons)

### Hackathon Architecture Decisions
*   **In-Memory Vector Search over JSONB:** Setting up pgvector extensions in a 24-hour hackathon can be time-consuming. We chose to store the chunk embedding arrays directly as a `jsonb` column in Supabase. On a query, the backend loads the document chunks into memory and calculates cosine similarity in Node.js. This keeps the database simple, light, and easy to deploy on free-tier Supabase.
*   **Defensive API Fallbacks:** Gemini API free tiers have tight rate limits. If the embedding or generative APIs fail, the chat widget automatically falls back to a custom TF-IDF-lite keyword search over the stored chunks to display the closest match without crashing the UI.
*   **Sequential Embedding Rate Limiter:** During document upload, we split the text into chunks and embed them sequentially with a `200ms` delay between calls to respect Google's RPM limits on the free tier.

---

## 💾 Database Schema

<details>
<summary><b>Click to expand database schema (PostgreSQL)</b></summary>

Run this in your **Supabase SQL Editor** to set up the schema:

```sql
-- Documents metadata table
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

-- Performance Indexing
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_leads_conversation_id ON leads(conversation_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);
CREATE INDEX idx_leads_buying_probability ON leads(buying_probability);
```

</details>

---

## 🚀 Running Locally

<details>
<summary><b>Click to expand local setup & development instructions</b></summary>

### 1. Setup Environment
Clone the repository and install dependencies:
```bash
npm install
```

Create a `.env.local` file at the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Launch Dev Server
```bash
npm run dev
```
*   Customer Page & Chat Widget: `http://localhost:3000`
*   Owner Dashboard: `http://localhost:3000/dashboard`

</details>

---

## 🔮 Future Scope
*   **Embeddable Widget Script:** Generate a `<script>` tag that business owners can paste on any HTML website to render the widget in an iframe.
*   **Clerk Authentication & Multi-Tenancy:** Move from a single hardcoded business to a full multi-tenant model using the predefined `business_id` column.
*   **Real WhatsApp / SMS Integration:** Integrate the official Meta Cloud API to automatically text owners when a hot lead is captured and send booking confirmations to customers.
