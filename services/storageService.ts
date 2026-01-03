import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseEnabled = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

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
    // Fallback handled by checks below
  }
} else {
  console.log("☁️ Firebase keys missing. Using Local Storage mode.");
}

// --- LOCAL STORAGE FALLBACKS ---
const STORAGE_PREFIX = 'jiya_cloud_v1_';
const getStorageKey = (id: string) => `${STORAGE_PREFIX}${id}`;
const SIMULATED_DELAY = 100; 

// --- PUBLIC API ---

export const createCloudBoard = async (data: any): Promise<string> => {
  const id = 'board_' + Date.now().toString(36);
  
  if (isFirebaseEnabled && db) {
    try {
      await setDoc(doc(db, "boards", id), data);
      return id;
    } catch (e) {
      console.warn("Firebase create failed, falling back to local", e);
    }
  }

  // Local Fallback
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  localStorage.setItem(getStorageKey(id), JSON.stringify(data));
  return id;
};

export const updateCloudBoard = async (id: string, data: any): Promise<void> => {
  if (isFirebaseEnabled && db) {
    try {
      await setDoc(doc(db, "boards", id), data, { merge: true });
      return;
    } catch (e) {
      console.warn("Firebase update failed", e);
      throw e; // Propagate error to show "Sync Failed" in UI if real backend fails
    }
  }

  // Local Fallback
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  localStorage.setItem(getStorageKey(id), JSON.stringify(data));
  
  // Trigger event for cross-tab sync
  window.dispatchEvent(new StorageEvent('storage', {
    key: getStorageKey(id),
    newValue: JSON.stringify(data)
  }));
};

export const getCloudBoard = async (id: string): Promise<any> => {
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
      // If authentic failure (permission/network), throw. 
      // If we just enabled firebase but data is in local, we might want to check local?
      // For now, strict separation. If firebase is on, we expect data there.
      if (e.message === "Board not found") throw e;
      console.warn("Firebase get failed", e);
      // Optional: Fallback to local if network fails? 
      // No, that causes "split brain" data. Better to show error.
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