import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationId, locationId, grupaId } = await request.json();

    if (!email || !password || !organizationId || !locationId || !grupaId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔐 Creating educatoare account:', email);

    // 1. Verifică dacă user-ul există deja
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log('✅ User already exists:', userRecord.uid);
    } catch (error: any) {
      // User nu există, îl creăm
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Creating new Firebase Auth user...');
        userRecord = await adminAuth.createUser({
          email,
          password,
          emailVerified: false,
        });
        console.log('✅ Firebase Auth user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 2. Creează/Actualizează documentul educatoare în Firestore
    const educatoareRef = adminDb.collection('educatoare').doc(userRecord.uid);
    await educatoareRef.set({
      email,
      organizationId,
      locationId,
      grupaId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Educatoare document created in Firestore');

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      email: userRecord.email,
    });

  } catch (error: any) {
    console.error('❌ Error creating educatoare:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create educatoare account' },
      { status: 500 }
    );
  }
}
