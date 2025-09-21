#!/usr/bin/env ts-node

import * as admin from "firebase-admin";
import { ingestLocalPDF } from "../functions/src/lib/kbProcessor";
import * as path from "path";
import * as fs from "fs";

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (serviceAccount && fs.existsSync(serviceAccount)) {
  const serviceAccountData = require(path.resolve(serviceAccount));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountData),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
} else {
  // For emulator or default credentials
  admin.initializeApp();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage: npm run ingest-kb <pdf-file-path> [upload-path]

Examples:
  npm run ingest-kb ./docs/vedic-astrology-guide.pdf
  npm run ingest-kb ./docs/astrology-basics.pdf kb/guides/astrology-basics.pdf
    `);
    process.exit(1);
  }

  const pdfPath = args[0];
  const uploadPath = args[1] || `kb/${path.basename(pdfPath)}`;

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found: ${pdfPath}`);
    process.exit(1);
  }

  if (!pdfPath.toLowerCase().endsWith('.pdf')) {
    console.error('Error: File must be a PDF');
    process.exit(1);
  }

  console.log(`Starting KB ingestion...`);
  console.log(`Source file: ${pdfPath}`);
  console.log(`Upload path: ${uploadPath}`);

  try {
    await ingestLocalPDF(pdfPath, uploadPath);
    console.log('✅ KB ingestion completed successfully!');
  } catch (error) {
    console.error('❌ KB ingestion failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

