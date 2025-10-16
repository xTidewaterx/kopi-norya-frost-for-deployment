import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://norland-a7730-default-rtdb.firebaseio.com",
  });
}

export const db = admin.firestore(); // ✅ must export
