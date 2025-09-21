import express from "express";
import fetch from "node-fetch";
import * as admin from "firebase-admin";
import { verifyFirebaseIdToken } from "../middleware/auth";

const router = express.Router();

interface KundliRequest {
  dob: string; // Date of Birth (YYYY-MM-DD)
  tob: string; // Time of Birth (HH:MM)
  pob: string; // Place of Birth
  lat?: number; // Latitude
  lon?: number; // Longitude
}

router.post("/", verifyFirebaseIdToken, async (req, res) => {
  const { dob, tob, pob, lat, lon }: KundliRequest = req.body;
  const uid = (req as any).uid;

  if (!dob || !tob || !pob) {
    return res.status(400).json({ error: "Missing birth details" });
  }

  const cacheKey = `${dob}|${tob}|${pob}`;

  try {
    // Check cache first
    const cachedSnap = await admin.firestore().collection("kundli_cache")
      .where("cacheKey", "==", cacheKey).limit(1).get();

    if (!cachedSnap.empty) {
      const doc = cachedSnap.docs[0];
      console.log("Returning cached kundli data");
      return res.json({ 
        data: doc.data().payload, 
        cached: true,
        cacheId: doc.id 
      });
    }

    // Call ProKerala API
    console.log("Calling ProKerala API for new kundli data");
    const proRes = await fetch(`${process.env.PROKERAL_BASE_URL}/kundli`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PROKERAL_API_KEY}`
      },
      body: JSON.stringify({ 
        dob, 
        tob, 
        pob, 
        lat: lat || null, 
        lon: lon || null 
      })
    });

    if (!proRes.ok) {
      const errTxt = await proRes.text();
      console.error("ProKerala API error:", errTxt);
      return res.status(502).json({ 
        error: "ProKerala API error", 
        details: errTxt 
      });
    }

    const proJson = await proRes.json();

    // Store in cache
    const cacheRef = await admin.firestore().collection("kundli_cache").add({
      cacheKey,
      payload: proJson,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: uid
    });

    // Update user's birth details if not set
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.update({
      dateOfBirth: dob,
      timeOfBirth: tob,
      placeOfBirth: pob,
      ...(lat && { latitude: lat }),
      ...(lon && { longitude: lon }),
      lastKundliGenerated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Kundli data cached and user updated");
    return res.json({ 
      data: proJson, 
      cached: false,
      cacheId: cacheRef.id 
    });

  } catch (err) {
    console.error("Kundli handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

