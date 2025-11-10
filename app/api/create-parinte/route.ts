import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      nume,
      telefon,
      organizationId, 
      locationId, 
      copilCnp,
      copilNume,
      grupaId 
    } = await request.json();

    if (!email || !password || !organizationId || !locationId || !copilCnp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔐 Creating parinte account:', email);

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
          displayName: nume,
        });
        console.log('✅ Firebase Auth user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 2. Creează/Actualizează documentul parinte în Firestore
    const parinteRef = adminDb.collection('parinti').doc(userRecord.uid);
    await parinteRef.set({
      email,
      nume,
      telefon,
      organizationId,
      locationId,
      copilCnp,
      copilNume,
      grupaId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      notificationSettings: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
      }
    });

    console.log('✅ Parinte document created in Firestore');

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      email: userRecord.email,
      message: 'Cont părinte creat cu succes',
    });

  } catch (error: any) {
    console.error('❌ Error creating parinte:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create parinte account' },
      { status: 500 }
    );
  }
}
