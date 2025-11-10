import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Configurare Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const residentCnp = formData.get('residentCnp') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string;
    const locationId = formData.get('locationId') as string;

    if (!file || !residentCnp || !userId || !locationId) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 });
    }

    console.log('📸 Upload foto:', file.name, 'pentru rezident:', residentCnp);
    console.log('🔍 userId:', userId);
    console.log('🔍 locationId (caminId):', locationId);
    console.log('🔍 Path Firestore:', `companies/${userId}/camine/${locationId}/residents/${residentCnp}/gallery`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload la Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: `iempathy/${userId}/${residentCnp}`,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' }, // Max 1920x1920
        { quality: 'auto:good' }, // Compresie automată
      ],
    });

    console.log('✅ Upload Cloudinary reușit:', uploadResult.secure_url);

    // Salvare metadata în Firestore (structura VECHE - companies/camine) - ADMIN SDK
    const galleryRef = adminDb
      .collection('companies')
      .doc(userId)
      .collection('camine')
      .doc(locationId)
      .collection('residents')
      .doc(residentCnp)
      .collection('gallery');

    const photoDoc = await galleryRef.add({
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      uploadedBy: userId,
      uploadedAt: FieldValue.serverTimestamp(),
      description: description || '',
      category: category || 'altele',
      fileName: file.name,
      fileSize: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    });

    console.log('✅ Metadata salvată în Firestore:', photoDoc.id);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      photoId: photoDoc.id,
    });
  } catch (error: any) {
    console.error('❌ Eroare upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
