// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, signInWithGooglePopup, signOutFirebase, db } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'end_user' | 'astrologer' | 'admin';
  credits: number;
  referralCode: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  idToken: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setIdToken(token);
        
        // Persist basic profile in Firestore users collection on first login
        const userRef = doc(db, "users", fbUser.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          const referralCode = generateReferralCode(fbUser.uid);
          await setDoc(userRef, {
            uid: fbUser.uid,
            name: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            role: "end_user",
            credits: 5, // initial free 5 questions
            referralCode,
            referredBy: null,
            createdAt: serverTimestamp()
          });
          
          // Set user with default values
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            role: 'end_user',
            credits: 5,
            referralCode
          });
        } else {
          // User exists, get their data
          const userData = snap.data();
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            role: userData.role || 'end_user',
            credits: userData.credits || 5,
            referralCode: userData.referralCode || generateReferralCode(fbUser.uid)
          });
        }
      } else {
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateReferralCode = (uid: string) => {
    return `REF-${uid.slice(0, 6).toUpperCase()}`;
  };

  const signInWithGoogle = async () => {
    await signInWithGooglePopup();
    // onAuthStateChanged will handle the rest
  };

  const signOut = async () => {
    await signOutFirebase();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, idToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

