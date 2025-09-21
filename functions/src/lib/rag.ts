import OpenAI from "openai";
import { Pinecone } from "pinecone-client";
import * as admin from "firebase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export interface KundliFacts {
  kundliFacts: string;
  snippets: Array<{
    id: string;
    text: string;
    source: string;
    score: number;
  }>;
  question: string;
}

export interface LLMResponse {
  shortAnswer: string;
  percentScore: number;
  explanation: string;
  confidenceBreakdown: {
    prokerala: number;
    knowledgeBase: number;
    llmConf: number;
  };
  sources: Array<{
    id: string;
    snippet: string;
    source: string;
  }>;
}

export async function getTopSnippetsForQuestion(question: string, topK: number = 5): Promise<Array<{
  id: string;
  text: string;
  source: string;
  score: number;
}>> {
  try {
    // Generate embedding for the question
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const questionEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const queryResponse = await pinecone.query({
      vector: questionEmbedding,
      topK,
      includeMetadata: true,
      namespace: "astroai-kb"
    });

    return queryResponse.matches?.map(match => ({
      id: match.id || "",
      text: match.metadata?.text as string || "",
      source: match.metadata?.source as string || "",
      score: match.score || 0
    })) || [];

  } catch (error) {
    console.error("Error querying vector store:", error);
    return [];
  }
}

export function buildPromptFromKundliAndSnippets({ kundliFacts, snippets, question }: KundliFacts): string {
  const snippetsText = snippets.map(s => `[${s.source}] ${s.text}`).join('\n\n');
  
  return `You are an expert astrologer with access to traditional Vedic astrology knowledge and a comprehensive knowledge base.

KUNDLI DATA:
${kundliFacts || "No kundli data available"}

KNOWLEDGE BASE CONTEXT:
${snippetsText}

QUESTION: ${question}

INSTRUCTIONS:
1. Analyze the kundli data and knowledge base context
2. Provide a comprehensive astrological analysis
3. Give a percentage score (0-100) representing the likelihood/probability
4. Break down confidence sources
5. Cite specific sources used

RESPONSE FORMAT (JSON only):
{
  "shortAnswer": "Brief 2-3 sentence answer",
  "percentScore": 75,
  "explanation": "Detailed explanation in 2-4 sentences",
  "confidenceBreakdown": {
    "prokerala": 0.45,
    "knowledgeBase": 0.30,
    "llmConf": 0.25
  },
  "sources": [
    {
      "id": "source_id",
      "snippet": "relevant text snippet",
      "source": "source_name"
    }
  ]
}

Ensure the response is valid JSON only, no additional text.`;
}

export async function callLLM(prompt: string): Promise<LLMResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert astrologer. Always respond with valid JSON only, following the exact format specified."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
    // Validate required fields
    if (!parsed.shortAnswer || typeof parsed.percentScore !== 'number' || !parsed.explanation) {
      throw new Error("Invalid LLM response format");
    }

    return parsed as LLMResponse;

  } catch (error) {
    console.error("LLM call failed:", error);
    
    // Fallback response
    return {
      shortAnswer: "I apologize, but I'm unable to provide an analysis at this time. Please try again later.",
      percentScore: 50,
      explanation: "Technical difficulties prevented a proper analysis.",
      confidenceBreakdown: {
        prokerala: 0,
        knowledgeBase: 0,
        llmConf: 0
      },
      sources: []
    };
  }
}

