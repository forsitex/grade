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
    let isNewUser = false;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log('✅ User already exists:', userRecord.uid);
      
      // Actualizează displayName dacă s-a schimbat
      if (userRecord.displayName !== nume) {
        await adminAuth.updateUser(userRecord.uid, {
          displayName: nume,
        });
        console.log('✅ Updated user displayName');
      }
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
        isNewUser = true;
        console.log('✅ Firebase Auth user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 2. Creează/Actualizează documentul parinte în Firestore
    const parinteRef = adminDb.collection('parinti').doc(userRecord.uid);
    
    // Verifică dacă documentul există pentru a păstra createdAt
    const parinteDoc = await parinteRef.get();
    const existingData = parinteDoc.exists ? parinteDoc.data() : null;
    
    await parinteRef.set({
      email,
      nume,
      telefon,
      organizationId,
      locationId,
      copilCnp,
      copilNume,
      grupaId,
      createdAt: existingData?.createdAt || new Date(),
      updatedAt: new Date(),
      lastLogin: existingData?.lastLogin || null,
      notificationSettings: existingData?.notificationSettings || {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
      }
    });

    console.log(isNewUser ? '✅ Parinte document created in Firestore' : '✅ Parinte document updated in Firestore');

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
