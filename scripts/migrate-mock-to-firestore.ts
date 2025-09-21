#!/usr/bin/env ts-node

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (serviceAccount && fs.existsSync(serviceAccount)) {
  const serviceAccountData = require(path.resolve(serviceAccount));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountData),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
} else {
  admin.initializeApp();
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'astrologer' | 'admin';
  credits: number;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
}

interface MockQuestion {
  id: string;
  userId: string;
  question: string;
  answer: {
    percentage: number;
    summary: string;
    explanation: string;
    sources: Array<{
      id: string;
      snippet: string;
      confidence: number;
      source: string;
    }>;
    confidenceBreakdown: {
      astrology: number;
      knowledge: number;
      ai: number;
    };
  };
  verified?: boolean;
  completed: boolean;
}

interface MockKundli {
  id: string;
  userId: string;
  planets: Array<{
    name: string;
    sign: string;
    degree: string;
    house: string;
    nakshatra: string;
    retrograde: boolean;
  }>;
}

async function migrateMockData() {
  console.log('🚀 Starting migration of mock data to Firestore...');

  try {
    // Create mock data
    const mockUsers: MockUser[] = [
      {
        id: 'mock_user_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1',
        role: 'user',
        credits: 5,
        dateOfBirth: '1990-01-15',
        timeOfBirth: '10:30 AM',
        placeOfBirth: 'New Delhi, India'
      },
      {
        id: 'mock_astrologer_1',
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@astroai.com',
        role: 'astrologer',
        credits: 100,
        dateOfBirth: '1985-06-20',
        timeOfBirth: '2:15 PM',
        placeOfBirth: 'Mumbai, India'
      }
    ];

    const mockQuestions: MockQuestion[] = [
      {
        id: 'mock_question_1',
        userId: 'mock_user_1',
        question: 'What does my love life look like in 2025?',
        answer: {
          percentage: 78,
          summary: 'Strong potential for meaningful relationships and partnership opportunities.',
          explanation: 'Based on your birth chart analysis, Venus in your 7th house indicates harmonious relationships and partnership opportunities.',
          sources: [
            {
              id: 'source_1',
              snippet: 'Venus in 7th house indicates harmonious relationships and partnership opportunities.',
              confidence: 0.45,
              source: 'ProKerala'
            }
          ],
          confidenceBreakdown: {
            astrology: 0.45,
            knowledge: 0.30,
            ai: 0.25
          }
        },
        verified: true,
        completed: true
      }
    ];

    const mockKundliData = {
      id: 'mock_kundli_1',
      userId: 'mock_user_1',
      planets: [
        {
          name: 'Sun',
          sign: 'Aries',
          degree: '12°34\'',
          house: '10th',
          nakshatra: 'Bharani',
          retrograde: false
        },
        {
          name: 'Moon',
          sign: 'Cancer',
          degree: '25°12\'',
          house: '1st',
          nakshatra: 'Pushya',
          retrograde: false
        }
      ]
    };

    // Migrate users
    console.log('📝 Migrating users...');
    for (const user of mockUsers) {
      await admin.firestore().collection('users').doc(user.id).set({
        uid: user.id,
        name: user.name,
        email: user.email,
        photoURL: user.avatar,
        role: user.role === 'user' ? 'end_user' : user.role,
        credits: user.credits,
        referralCode: `REF-${user.id.slice(-6).toUpperCase()}`,
        referredBy: null,
        dateOfBirth: user.dateOfBirth,
        timeOfBirth: user.timeOfBirth,
        placeOfBirth: user.placeOfBirth,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: 'mock_data'
      });
      console.log(`✅ Migrated user: ${user.name}`);
    }

    // Migrate questions
    console.log('📝 Migrating questions...');
    for (const question of mockQuestions) {
      await admin.firestore().collection('questions').doc(question.id).set({
        userId: question.userId,
        category: 'love',
        questionText: question.question,
        answer: question.answer,
        verified: question.verified || false,
        completed: question.completed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: 'mock_data'
      });
      console.log(`✅ Migrated question: ${question.question.substring(0, 50)}...`);
    }

    // Migrate kundli data
    console.log('📝 Migrating kundli data...');
    const kundliCacheKey = `${mockUsers[0].dateOfBirth}|${mockUsers[0].timeOfBirth}|${mockUsers[0].placeOfBirth}`;
    await admin.firestore().collection('kundli_cache').add({
      cacheKey: kundliCacheKey,
      payload: mockKundliData,
      userId: mockUsers[0].id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFrom: 'mock_data'
    });
    console.log(`✅ Migrated kundli data for user: ${mockUsers[0].name}`);

    // Create sample KB document
    console.log('📝 Creating sample KB document...');
    await admin.firestore().collection('kb_documents').add({
      docId: 'sample_vedic_guide',
      fileName: 'vedic-astrology-guide.pdf',
      filePath: 'kb/guides/vedic-astrology-guide.pdf',
      totalChunks: 10,
      totalTokens: 5000,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFrom: 'mock_data'
    });
    console.log('✅ Created sample KB document');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users migrated: ${mockUsers.length}`);
    console.log(`- Questions migrated: ${mockQuestions.length}`);
    console.log(`- Kundli data migrated: 1`);
    console.log(`- KB documents created: 1`);

    console.log('\n🔑 Admin User Setup:');
    console.log('To set admin claims for the astrologer user, run:');
    console.log('firebase functions:shell');
    console.log('setAdminClaim({ uid: "mock_astrologer_1", admin: true })');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateMockData().catch(console.error);
}

export { migrateMockData };

