import express from "express";
import * as admin from "firebase-admin";
import { verifyFirebaseIdToken } from "../middleware/auth";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const router = express.Router();

interface GeneratePDFRequest {
  userId: string;
  sections: string[];
  includeCharts: boolean;
  astrologerNotes?: string;
  reportType: 'kundli' | 'question' | 'full_report';
  questionIds?: string[];
}

router.post("/generate", verifyFirebaseIdToken, async (req, res) => {
  const uid = (req as any).uid;
  const { 
    sections, 
    includeCharts, 
    astrologerNotes, 
    reportType,
    questionIds = []
  }: GeneratePDFRequest = req.body;

  if (!sections || sections.length === 0) {
    return res.status(400).json({ error: "No sections specified" });
  }

  try {
    // Get user data
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userDoc.data()!;

    // Get questions if specified
    let questionsData = [];
    if (questionIds.length > 0) {
      const questionsSnap = await admin.firestore()
        .collection("questions")
        .where("userId", "==", uid)
        .where(admin.firestore.FieldPath.documentId(), "in", questionIds)
        .get();
      
      questionsData = questionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Get kundli data if user has it
    let kundliData = null;
    if (userData.dateOfBirth && userData.timeOfBirth && userData.placeOfBirth) {
      const kundliSnap = await admin.firestore()
        .collection("kundli_cache")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      
      if (!kundliSnap.empty) {
        kundliData = kundliSnap.docs[0].data();
      }
    }

    // Generate HTML content
    const htmlContent = generateHTMLReport({
      user: userData,
      sections,
      includeCharts,
      astrologerNotes,
      questions: questionsData,
      kundli: kundliData,
      reportType
    });

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent);

    // Upload to Firebase Storage
    const fileName = `reports/${uid}/${reportType}_${Date.now()}.pdf`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          userId: uid,
          reportType,
          generatedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable (or use signed URL for private access)
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Store report metadata in Firestore
    const reportRef = await admin.firestore().collection("reports").add({
      userId: uid,
      type: reportType,
      sections,
      includeCharts,
      pdfUrl: publicUrl,
      storagePath: fileName,
      questionIds,
      astrologerNotes,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      reportId: reportRef.id,
      pdfUrl: publicUrl,
      downloadUrl: publicUrl // For immediate download
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ error: "PDF generation failed" });
  }
});

async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateHTMLReport(data: {
  user: any;
  sections: string[];
  includeCharts: boolean;
  astrologerNotes?: string;
  questions: any[];
  kundli: any;
  reportType: string;
}): string {
  const { user, sections, includeCharts, astrologerNotes, questions, kundli, reportType } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AstroAI Report - ${user.displayName || user.name}</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #6A0DAD;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6A0DAD;
      margin-bottom: 10px;
    }
    .user-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #6A0DAD;
      margin-bottom: 15px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .question-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .answer-score {
      font-size: 24px;
      font-weight: bold;
      color: #6A0DAD;
      margin: 10px 0;
    }
    .kundli-chart {
      text-align: center;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .astrologer-notes {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">✨ AstroAI</div>
    <h1>Personalized Astrology Report</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="user-info">
    <h2>User Information</h2>
    <p><strong>Name:</strong> ${user.displayName || user.name || 'User'}</p>
    <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
    ${user.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${user.dateOfBirth}</p>` : ''}
    ${user.timeOfBirth ? `<p><strong>Time of Birth:</strong> ${user.timeOfBirth}</p>` : ''}
    ${user.placeOfBirth ? `<p><strong>Place of Birth:</strong> ${user.placeOfBirth}</p>` : ''}
  </div>

  ${sections.includes('kundli') && kundli ? `
    <div class="section page-break">
      <div class="section-title">Kundli Analysis</div>
      <div class="kundli-chart">
        <p>Birth Chart Analysis</p>
        <p><em>Detailed kundli interpretation based on Vedic astrology principles</em></p>
      </div>
    </div>
  ` : ''}

  ${sections.includes('questions') && questions.length > 0 ? `
    <div class="section page-break">
      <div class="section-title">AI Predictions & Insights</div>
      ${questions.map(q => `
        <div class="question-item">
          <h4>${q.questionText}</h4>
          <div class="answer-score">${q.answer?.percentScore || 0}%</div>
          <p><strong>Analysis:</strong> ${q.answer?.explanation || 'No explanation available'}</p>
          <p><strong>Summary:</strong> ${q.answer?.shortAnswer || 'No summary available'}</p>
          ${q.answer?.sources?.length > 0 ? `
            <p><strong>Sources:</strong></p>
            <ul>
              ${q.answer.sources.map((s: any) => `<li>${s.snippet}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${astrologerNotes ? `
    <div class="section">
      <div class="section-title">Astrologer Notes</div>
      <div class="astrologer-notes">
        <p>${astrologerNotes}</p>
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p>This report was generated by AstroAI - AI-Powered Astrology Platform</p>
    <p>For personalized consultations, please contact our certified astrologers</p>
  </div>
</body>
</html>`;
}

export default router;

