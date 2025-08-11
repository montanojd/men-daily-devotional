import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Firebase config (real values supplied by user)
const firebaseConfig = {
  apiKey: 'AIzaSyD4s_yysV9HI4tb7ZIT_87JwzP5lc3QPgY',
  authDomain: 'devotionalmen.firebaseapp.com',
  databaseURL: 'https://devotionalmen-default-rtdb.firebaseio.com',
  projectId: 'devotionalmen',
  storageBucket: 'devotionalmen.firebasestorage.app',
  messagingSenderId: '573562582048',
  appId: '1:573562582048:web:b20a5ad274c1d2a13a7845'
};

export interface RemoteAdConfig {
  bannerAds?: { 
    adUnitIdIOS?: string; 
    adUnitIdAndroid?: string;
    status?: boolean 
  };
  interstitialAds?: { 
    adUnitIdIOS?: string; 
    adUnitIdAndroid?: string;
    status?: boolean 
  };
  openAds?: { 
    adUnitIdIOS?: string; 
    adUnitIdAndroid?: string;
    status?: boolean 
  };
}

export async function fetchAdmobConfig(): Promise<RemoteAdConfig | null> {
  if (!getApps().length) initializeApp(firebaseConfig);
  try {
    const db = getDatabase();
    const dbRef = ref(db, 'admob_config');
    const snap = await get(dbRef);
    if (snap.exists()) return snap.val();
    return null;
  } catch (e) {
    console.warn('Failed to fetch AdMob config', e);
    return null;
  }
}
