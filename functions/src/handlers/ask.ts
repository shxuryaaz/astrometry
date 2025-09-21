import express from "express";
import * as admin from "firebase-admin";
import { verifyFirebaseIdToken } from "../middleware/auth";
import { buildPromptFromKundliAndSnippets, callLLM, getTopSnippetsForQuestion, LLMResponse } from "../lib/rag";

const router = express.Router();

interface AskRequest {
  question: string;
  kundliCacheKey?: string;
  contextIds?: string[];
  category?: 'love' | 'finance' | 'career' | 'family' | 'health' | 'custom';
}

router.post("/", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const { question, kundliCacheKey, contextIds, category = 'custom' }: AskRequest = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty question" });
  }

  // Check if user has credits
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    return res.status(404).json({ error: "User not found" });
  }

  const userData = userDoc.data();
  if (!userData || userData.credits <= 0) {
    return res.status(402).json({ error: "Insufficient credits" });
  }

  try {
    // 1. Fetch kundli facts if provided
    let kundliFacts = "";
    if (kundliCacheKey) {
      const snap = await admin.firestore().collection("kundli_cache")
        .where("cacheKey", "==", kundliCacheKey).limit(1).get();
      if (!snap.empty) {
        kundliFacts = JSON.stringify(snap.docs[0].data().payload);
      }
    }

    // 2. Query vector DB for relevant snippets
    const snippets = await getTopSnippetsForQuestion(question, 5);

    // 3. Build prompt
    const prompt = buildPromptFromKundliAndSnippets({ 
      kundliFacts, 
      snippets, 
      question 
    });

    // 4. Call LLM
    const llmRes: LLMResponse = await callLLM(prompt);

    // 5. Store question document
    const qRef = await admin.firestore().collection("questions").add({
      userId: uid,
      category,
      questionText: question,
      answer: llmRes,
      kundliCacheKey: kundliCacheKey || null,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 6. Decrement user credits
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(-1),
      lastQuestionAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Question answered for user ${uid}, credits remaining: ${userData.credits - 1}`);

    return res.json({ 
      id: qRef.id, 
      answer: llmRes,
      creditsRemaining: userData.credits - 1
    });

  } catch (err) {
    console.error("Ask handler error:", err);
    return res.status(500).json({ error: "RAG processing failed" });
  }
});

// Get user's questions history
router.get("/history", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const questionsSnap = await admin.firestore()
      .collection("questions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const questions = questionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null
    }));

    return res.json({ questions });

  } catch (err) {
    console.error("History handler error:", err);
    return res.status(500).json({ error: "Failed to fetch questions history" });
  }
});

// Verify answer accuracy (user feedback)
router.post("/:questionId/verify", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const { questionId } = req.params;
  const { isAccurate } = req.body;

  if (typeof isAccurate !== 'boolean') {
    return res.status(400).json({ error: "isAccurate must be a boolean" });
  }

  try {
    const questionRef = admin.firestore().collection("questions").doc(questionId);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
      return res.status(404).json({ error: "Question not found" });
    }

    const questionData = questionDoc.data();
    if (questionData?.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await questionRef.update({
      verified: isAccurate,
      verificationFeedback: isAccurate ? "accurate" : "inaccurate",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true, verified: isAccurate });

  } catch (err) {
    console.error("Verify handler error:", err);
    return res.status(500).json({ error: "Failed to verify answer" });
  }
});

export default router;

