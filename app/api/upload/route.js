import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { chunkDocument } from '@/lib/rag';
import { generateEmbedding } from '@/lib/gemini';

/**
 * POST /api/upload
 *
 * Accepts { text, filename }, stores the document, chunks it, embeds each
 * chunk, and stores everything in Supabase.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { text, filename } = body;

    // --- Validate input ---------------------------------------------------
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "text" field' },
        { status: 400 }
      );
    }
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'Missing "filename" field' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // --- Store the raw document -------------------------------------------
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({ filename: filename.trim(), raw_text: text })
      .select('id')
      .single();

    if (docError) {
      console.error('[upload] Failed to insert document:', docError);
      return NextResponse.json(
        { error: 'Failed to store document', details: docError.message },
        { status: 500 }
      );
    }

    const documentId = doc.id;

    // --- Chunk the document -----------------------------------------------
    const chunks = chunkDocument(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: true, documentId, chunkCount: 0, message: 'Document stored but produced no chunks' },
        { status: 200 }
      );
    }

    // --- Embed each chunk sequentially ------------------------------------
    const chunkRows = [];
    let embeddedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];

      // Rate-limit: 200 ms pause between embedding calls
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const embedding = await generateEmbedding(chunkText);

      chunkRows.push({
        document_id: documentId,
        chunk_text: chunkText,
        embedding: embedding, // null if embedding failed — stored as JSONB null
        chunk_index: i,
      });

      if (embedding) embeddedCount++;
    }

    // --- Bulk-insert chunks -----------------------------------------------
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRows);

    if (chunksError) {
      console.error('[upload] Failed to insert chunks:', chunksError);
      return NextResponse.json(
        { error: 'Document stored but failed to save chunks', details: chunksError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentId,
      chunkCount: chunks.length,
      embeddedCount,
      message:
        embeddedCount === chunks.length
          ? 'All chunks embedded successfully'
          : `${embeddedCount}/${chunks.length} chunks embedded — some embeddings failed and were stored as null`,
    });
  } catch (error) {
    console.error('[upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
