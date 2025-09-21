import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Import handlers
import kundliRouter from "./handlers/kundli";
import askRouter from "./handlers/ask";
import paymentRouter from "./handlers/payment";
import pdfRouter from "./handlers/pdf";

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/kundli", kundliRouter);
app.use("/ask", askRouter);
app.use("/payment", paymentRouter);
app.use("/pdf", pdfRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// KB Ingestion Function (triggered by Storage upload)
export const processKBUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;

  // Only process PDF files in the kb/ folder
  if (!filePath?.startsWith('kb/') || contentType !== 'application/pdf') {
    console.log('Skipping non-PDF or non-KB file:', filePath);
    return;
  }

  console.log('Processing KB upload:', filePath);

  try {
    // Import the KB processing function
    const { processPDFDocument } = await import('./lib/kbProcessor');
    
    await processPDFDocument(filePath);
    console.log('Successfully processed KB document:', filePath);
  } catch (error) {
    console.error('Error processing KB document:', error);
    throw error;
  }
});

// Scheduled function to clean up old cache entries (runs daily)
export const cleanupOldCache = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running cache cleanup...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const oldCacheQuery = admin.firestore()
        .collection('kundli_cache')
        .where('createdAt', '<', thirtyDaysAgo);
      
      const snapshot = await oldCacheQuery.get();
      const batch = admin.firestore().batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} old cache entries`);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  });

// Function to set admin custom claims (for admin user creation)
export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if the caller is already an admin (this should be set manually for the first admin)
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims');
  }

  const { uid, admin: isAdmin } = data;
  
  if (!uid || typeof isAdmin !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid arguments');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    
    // Update user role in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role: isAdmin ? 'admin' : 'end_user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: `User ${uid} admin status set to ${isAdmin}` };
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim');
  }
});

// Analytics function to track usage
export const trackUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { event, metadata } = data;
  
  if (!event) {
    throw new functions.https.HttpsError('invalid-argument', 'Event is required');
  }

  try {
    await admin.firestore().collection('analytics').add({
      userId: context.auth.uid,
      event,
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: context.rawRequest.headers['user-agent'],
      ip: context.rawRequest.ip
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track usage');
  }
});

