import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import OpenAI from "openai";
import { Pinecone } from "pinecone-client";
import { PDFDocument } from "pdf-lib";

const storage = new Storage();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface ChunkMetadata {
  docId: string;
  page: number;
  chunkIndex: number;
  text: string;
  sourceUri: string;
  section?: string;
  topic?: string;
}

export async function processPDFDocument(filePath: string): Promise<void> {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'your-bucket';
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  try {
    console.log(`Starting processing of ${filePath}`);
    
    // Download PDF from storage
    const [pdfBuffer] = await file.download();
    
    // Extract text from PDF
    const textContent = await extractTextFromPDF(pdfBuffer);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    // Split into chunks
    const chunks = splitTextIntoChunks(textContent, 500, 100); // 500 tokens per chunk, 100 token overlap
    
    // Generate embeddings and store in vector DB
    const docId = generateDocId(filePath);
    await processChunks(chunks, docId, filePath);

    // Store document metadata in Firestore
    await admin.firestore().collection('kb_documents').doc(docId).set({
      docId,
      fileName: filePath.split('/').pop(),
      filePath,
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, chunk) => sum + chunk.text.split(' ').length, 0),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    console.log(`Successfully processed ${filePath}: ${chunks.length} chunks`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    
    // Store error status in Firestore
    const docId = generateDocId(filePath);
    await admin.firestore().collection('kb_documents').doc(docId).set({
      docId,
      fileName: filePath.split('/').pop(),
      filePath,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    let fullText = '';
    
    for (let i = 0; i < pages.length; i++) {
      // Note: pdf-lib doesn't extract text directly
      // For production, consider using pdf-parse or pdf2pic + OCR
      // This is a simplified version
      fullText += `[Page ${i + 1} content would be extracted here]\n\n`;
    }
    
    // For demo purposes, return sample astrology content
    return `
    Vedic Astrology Principles
    
    The Sun represents the soul, ego, and vitality. When well-placed, it gives leadership qualities, confidence, and authority. 
    In the 1st house, it enhances personality and self-expression. In the 10th house, it indicates career success and recognition.
    
    The Moon governs emotions, mind, and intuition. It's particularly important in determining mental stability and emotional responses.
    A strong Moon in Cancer or the 4th house indicates a caring, nurturing nature.
    
    Mars represents energy, courage, and action. Its placement determines how one approaches challenges and conflicts.
    Mars in Aries or the 1st house gives pioneering spirit and leadership abilities.
    
    Mercury rules communication, intelligence, and commerce. Its position affects learning abilities and communication style.
    Mercury in Gemini or the 3rd house enhances communication skills and intellectual pursuits.
    
    Jupiter is the planet of wisdom, expansion, and spirituality. It brings growth, optimism, and higher learning.
    Jupiter in Sagittarius or the 9th house indicates philosophical inclinations and spiritual growth.
    
    Venus governs love, beauty, and material comforts. It influences relationships and aesthetic preferences.
    Venus in Libra or the 7th house enhances relationship harmony and artistic abilities.
    
    Saturn represents discipline, karma, and limitations. It teaches through challenges and brings maturity.
    Saturn in Capricorn or the 10th house indicates career dedication and long-term success.
    `;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): Array<{ text: string; page?: number }> {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push({
      text: chunkWords.join(' '),
      page: Math.floor(i / chunkSize) + 1
    });
  }
  
  return chunks;
}

async function processChunks(chunks: Array<{ text: string; page?: number }>, docId: string, sourceUri: string): Promise<void> {
  const batchSize = 10; // Process in batches to avoid rate limits
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    // Generate embeddings for batch
    const texts = batch.map(chunk => chunk.text);
    const embeddings = await generateEmbeddings(texts);
    
    // Prepare vectors for Pinecone
    const vectors = batch.map((chunk, index) => ({
      id: `${docId}_chunk_${i + index}`,
      values: embeddings[index],
      metadata: {
        docId,
        chunkIndex: i + index,
        text: chunk.text,
        sourceUri,
        page: chunk.page || 1,
        source: 'astroai-kb'
      }
    }));
    
    // Upsert to Pinecone
    await pinecone.upsert({
      vectors,
      namespace: 'astroai-kb'
    });
    
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
  }
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

function generateDocId(filePath: string): string {
  const fileName = filePath.split('/').pop()?.split('.')[0] || 'unknown';
  const timestamp = Date.now();
  return `kb_${fileName}_${timestamp}`;
}

// CLI function for manual KB ingestion
export async function ingestLocalPDF(filePath: string, uploadPath: string): Promise<void> {
  try {
    // Upload file to Firebase Storage first
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'your-bucket';
    const bucket = storage.bucket(bucketName);
    
    await bucket.upload(filePath, {
      destination: uploadPath,
      metadata: {
        contentType: 'application/pdf'
      }
    });
    
    console.log(`Uploaded ${filePath} to ${uploadPath}`);
    
    // Process the uploaded file
    await processPDFDocument(uploadPath);
    
    console.log('KB ingestion completed successfully');
  } catch (error) {
    console.error('KB ingestion failed:', error);
    throw error;
  }
}

