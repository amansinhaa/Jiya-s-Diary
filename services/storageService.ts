import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

// --- CONFIGURATION ---
const getFirebaseConfig = () => {
  // 1. Try Environment Variables (Priority)
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
  }
  
  // 2. Try Local Storage (Manual User Setup for Cross-Device Sync)
  try {
    const local = localStorage.getItem('jiya_firebase_config');
    if (local) return JSON.parse(local);
  } catch (e) {
    console.error("Invalid local firebase config", e);
  }

  // 3. Default Hardcoded Config (Fallback)
  return {
    apiKey: "AIzaSyBjN-Bgvd6n9HoAJzKfl4NiAh5nVPgssQw",
    authDomain: "jiyav-73e4b.firebaseapp.com",
    projectId: "jiyav-73e4b",
    storageBucket: "jiyav-73e4b.firebasestorage.app",
    messagingSenderId: "539444082502",
    appId: "1:539444082502:web:80fa6b8e31707647ab9747"
  };
};

const firebaseConfig = getFirebaseConfig();
const isFirebaseEnabled = !!(firebaseConfig?.apiKey && firebaseConfig?.projectId);

let db: any = null;
let storage: any = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("🔥 Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
} else {
  console.log("☁️ Firebase keys missing. Using Local Storage mode.");
}

// --- CONFIGURATION HELPERS ---
export const saveFirebaseConfig = (config: any) => {
  localStorage.setItem('jiya_firebase_config', JSON.stringify(config));
  window.location.reload(); 
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem('jiya_firebase_config');
  window.location.reload();
};

export const getCurrentConnectionStatus = () => isFirebaseEnabled;


// --- STORAGE KEYS & UTILS ---
const STORAGE_PREFIX = 'jiya_cloud_v1_';
const getStorageKey = (id: string) => `${STORAGE_PREFIX}${id}`;
const SIMULATED_DELAY = 100; 

// Helper to remove undefined values because Firestore rejects them
const sanitizeData = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

// --- PUBLIC API ---

export const createCloudBoard = async (data: any): Promise<string> => {
  const id = 'board_' + Date.now().toString(36);
  const cleanData = sanitizeData(data);
  
  if (isFirebaseEnabled && db) {
    try {
      await setDoc(doc(db, "boards", id), cleanData);
      return id;
    } catch (e) {
      console.warn("Firebase create failed, falling back to local", e);
    }
  }

  // Local Fallback
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  localStorage.setItem(getStorageKey(id), JSON.stringify(cleanData));
  return id;
};

export const updateCloudBoard = async (id: string, data: any): Promise<void> => {
  const cleanData = sanitizeData(data);

  if (isFirebaseEnabled && db) {
    try {
      // Optimistic update
      await setDoc(doc(db, "boards", id), cleanData, { merge: true });
      return;
    } catch (e) {
      console.warn("Firebase update failed", e);
      throw e;
    }
  }

  // Local Fallback
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  localStorage.setItem(getStorageKey(id), JSON.stringify(cleanData));
  
  // Trigger event for cross-tab sync in local mode
  window.dispatchEvent(new StorageEvent('storage', {
    key: getStorageKey(id),
    newValue: JSON.stringify(cleanData)
  }));
};

export const getCloudBoard = async (id: string): Promise<any> => {
  // This is used for initial load
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, "boards", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error("Board not found");
      }
    } catch (e: any) {
      if (e.message === "Board not found") throw e;
      console.warn("Firebase get failed", e);
      throw e;
    }
  }

  // Local Fallback
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  const dataString = localStorage.getItem(getStorageKey(id));
  if (!dataString) {
    throw new Error('Board not found');
  }
  return JSON.parse(dataString);
};

// REAL-TIME LISTENER
export const subscribeToBoard = (id: string, onUpdate: (data: any) => void) => {
  if (isFirebaseEnabled && db) {
    const docRef = doc(db, "boards", id);
    // Real-time listener using onSnapshot
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate(data);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
    });
    return unsubscribe;
  }
  
  return () => {}; // No-op for local mode (handled via storage event elsewhere)
};

export const uploadMedia = async (file: File): Promise<string> => {
  if (isFirebaseEnabled && storage) {
    try {
      const fileName = `images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      console.error("Firebase Storage upload failed", e);
      throw new Error("Cloud upload failed");
    }
  }

  // Local Fallback (Base64)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to process image"));
    reader.readAsDataURL(file);
  });
};

export const uploadBase64 = async (base64String: string): Promise<string> => {
  if (isFirebaseEnabled && storage) {
    try {
      // Create a unique filename
      const fileName = `generated/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const storageRef = ref(storage, fileName);
      
      // Upload the base64 string
      await uploadString(storageRef, base64String, 'data_url');
      
      // Get the URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (e) {
      console.error("Firebase Storage upload base64 failed", e);
      // If upload fails, return the original base64 but warn
      console.warn("Returning large base64 string, this might fail Firestore save.");
      return base64String;
    }
  }
  return base64String;
};