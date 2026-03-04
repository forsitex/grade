import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email, password, nume, organizationId, locationId, optionalId } =
      await request.json();

    if (!email || !password || !nume || !organizationId || !locationId) {
      return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
    }

    let userRecord;

    try {
      // Verifică dacă utilizatorul există deja
      userRecord = await adminAuth.getUserByEmail(email);

      // Dacă există, actualizează displayName
      if (userRecord.displayName !== nume) {
        await adminAuth.updateUser(userRecord.uid, {
          displayName: nume,
        });
      }
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Creează utilizator nou
        userRecord = await adminAuth.createUser({
          email,
          password,
          emailVerified: false,
          displayName: nume,
        });
      } else {
        throw error;
      }
    }

    // Creează/actualizează documentul în Firestore
    await adminDb
      .collection("profesori")
      .doc(userRecord.uid)
      .set(
        {
          nume,
          email,
          organizationId,
          locationId,
          optionalId: optionalId || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: "Profesor creat cu succes",
    });
  } catch (error: any) {
    console.error("Eroare creare profesor:", error);
    return NextResponse.json(
      { error: error.message || "Eroare la crearea profesorului" },
      { status: 500 },
    );
  }
}
