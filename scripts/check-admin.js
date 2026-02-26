#!/usr/bin/env node
/**
 * Script pentru verificare cont admin
 * Rulează: node scripts/check-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Inițializare Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAdmin() {
  console.log('🔍 Verificare cont ADMIN...\n');
  
  try {
    // 1. Verifică Authentication
    console.log('📧 UTILIZATORI ÎNREGISTRAȚI (Firebase Auth):');
    console.log('='.repeat(60));
    
    const listUsersResult = await admin.auth().listUsers(10);
    
    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`\n${index + 1}. Email: ${userRecord.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Creat: ${new Date(userRecord.metadata.creationTime).toLocaleString('ro-RO')}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // 2. Verifică Organizations (Admin-uri)
    console.log('\n📋 ORGANIZAȚII (ADMIN-uri):');
    console.log('='.repeat(60));
    
    const orgsSnapshot = await db.collection('organizations').get();
    
    if (orgsSnapshot.empty) {
      console.log('⚠️  Nicio organizație găsită!');
    } else {
      orgsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Organizație: ${data.name || 'N/A'}`);
        console.log(`   Admin UID: ${doc.id}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   Tip: ${data.type || 'N/A'}`);
        console.log(`   Creat: ${data.createdAt?.toDate().toLocaleString('ro-RO') || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 3. Verifică Educatoare
    console.log('\n👩‍🏫 EDUCATOARE:');
    console.log('='.repeat(60));
    
    const educatoareSnapshot = await db.collection('educatoare').get();
    
    if (educatoareSnapshot.empty) {
      console.log('⚠️  Nicio educatoare găsită!');
    } else {
      educatoareSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Nume: ${data.nume || 'N/A'}`);
        console.log(`   UID: ${doc.id}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   OrganizationId: ${data.organizationId || 'N/A'}`);
        console.log(`   LocationId: ${data.locationId || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verificare completă!\n');
    
  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAdmin();
