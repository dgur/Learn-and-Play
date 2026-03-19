import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, linkWithPopup }
  from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getAnalytics, logEvent }
  from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyCqvNReiOmiwhPly1MHEvTkaSJCV5X8-Y0",
  authDomain: "learn-and-play-5379.firebaseapp.com",
  projectId: "learn-and-play-5379",
  storageBucket: "learn-and-play-5379.firebasestorage.app",
  messagingSenderId: "649313346793",
  appId: "1:649313346793:web:2c2364aea5198015aafc78",
  measurementId: "G-LK4T7DB48S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics = null;
try { analytics = getAnalytics(app); } catch(e) { console.warn('Analytics not available:', e); }

function trackEvent(eventName, params) {
  if (analytics) logEvent(analytics, eventName, params);
}
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let onUserReady = null;

const userReadyPromise = new Promise(resolve => { onUserReady = resolve; });

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    onUserReady(user);
  } else {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error('Anonymous auth failed:', e);
      onUserReady(null);
    }
  }
});

async function loginWithGoogle() {
  try {
    if (currentUser && currentUser.isAnonymous) {
      const result = await linkWithPopup(currentUser, googleProvider);
      return result.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (e) {
    if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
    console.error('Google login failed:', e);
    return null;
  }
}

function isLoggedIn() {
  return currentUser && !currentUser.isAnonymous;
}

async function loadCloudProgress(gameId) {
  if (!currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      return data.games?.[gameId] || null;
    }
  } catch (e) {
    console.error('Load cloud progress failed:', e);
  }
  return null;
}

async function saveCloudProgress(gameId, progressData) {
  if (!currentUser) return;
  try {
    await setDoc(doc(db, 'users', currentUser.uid), {
      games: { [gameId]: progressData },
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('Save cloud progress failed:', e);
  }
}

async function loadPremiumStatus() {
  if (!currentUser) return false;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) return snap.data().premium === true;
  } catch (e) {
    console.error('Load premium failed:', e);
  }
  return false;
}

export {
  auth, db, currentUser, userReadyPromise,
  loginWithGoogle, isLoggedIn,
  loadCloudProgress, saveCloudProgress, loadPremiumStatus,
  trackEvent
};
