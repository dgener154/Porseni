import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { StorageService } from './storage';
import {
  Lembaga,
  Peserta,
  CabangLomba,
  Pengumuman,
  JadwalKegiatan,
  FotoKegiatan,
  VideoKegiatan,
  PengaturanSistem,
  User,
} from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfigData) : getApp();

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(
  app,
  firebaseConfigData.firestoreDatabaseId || '(default)'
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: false,
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let _isCloudOnline = false;
export function isCloudOnline(): boolean {
  return _isCloudOnline;
}

// Test connection on boot as mandated by the skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    _isCloudOnline = true;
    console.log('[Firebase] Connection to Firestore verified and online.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porseni_connection_status', { detail: { online: true } }));
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      _isCloudOnline = false;
      console.warn('[Firebase] Client is offline or database initializing.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porseni_connection_status', { detail: { online: false } }));
      }
      return false;
    }
    // Connected even if test doc does not exist
    _isCloudOnline = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porseni_connection_status', { detail: { online: true } }));
    }
    return true;
  }
}

// Auto-run connection test
testFirebaseConnection();

/**
 * Push an individual document to Firestore immediately in the background
 * This ensures that as soon as any device adds/edits a Peserta, Lembaga, Cabang, etc.,
 * it is sent straight to Firestore without waiting for a manual full sync.
 */
export async function syncDocToFirestore(
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  try {
    if (!docId) return;
    const cleanDocId = String(docId).replace(/\//g, '_');
    await setDoc(doc(db, collectionName, cleanDocId), data, { merge: true });
    _isCloudOnline = true;
  } catch (error) {
    console.warn(`[Firestore syncDoc fail] ${collectionName}/${docId}:`, error);
  }
}

/**
 * Delete an individual document from Firestore in the background
 */
export async function deleteDocFromFirestore(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    if (!docId) return;
    const cleanDocId = String(docId).replace(/\//g, '_');
    await deleteDoc(doc(db, collectionName, cleanDocId));
    _isCloudOnline = true;
  } catch (error) {
    console.warn(`[Firestore deleteDoc fail] ${collectionName}/${docId}:`, error);
  }
}

/**
 * Upload all local records to Firebase Firestore (Push to Cloud)
 */
export async function uploadAllToFirestore(): Promise<{
  success: boolean;
  message: string;
  counts: { lembaga: number; peserta: number; cabang: number };
}> {
  try {
    const lembagaList = StorageService.getLembaga();
    const pesertaList = StorageService.getPeserta();
    const cabangList = StorageService.getCabang();
    const settings = StorageService.getPengaturan();
    const pengumumanList = StorageService.getPengumuman();
    const jadwalList = StorageService.getJadwal();
    const fotoList = StorageService.getFotoKegiatan();
    const videoList = StorageService.getVideoKegiatan();
    const usersList = StorageService.getUsers();

    // 1. Write lembaga
    for (const item of lembagaList) {
      await setDoc(doc(db, 'lembaga', item.id), item, { merge: true });
    }

    // 2. Write peserta
    for (const item of pesertaList) {
      await setDoc(doc(db, 'peserta', item.id), item, { merge: true });
    }

    // 3. Write cabang
    for (const item of cabangList) {
      await setDoc(doc(db, 'cabang', item.id), item, { merge: true });
    }

    // 4. Write pengaturan
    await setDoc(doc(db, 'pengaturan', 'global'), settings, { merge: true });

    // 5. Write pengumuman
    for (const item of pengumumanList) {
      await setDoc(doc(db, 'pengumuman', item.id), item, { merge: true });
    }

    // 6. Write jadwal
    for (const item of jadwalList) {
      await setDoc(doc(db, 'jadwal', item.id), item, { merge: true });
    }

    // 7. Write foto kegiatan
    for (const item of fotoList) {
      await setDoc(doc(db, 'foto_kegiatan', item.id), item, { merge: true });
    }

    // 8. Write video kegiatan
    for (const item of videoList) {
      await setDoc(doc(db, 'video_kegiatan', item.id), item, { merge: true });
    }

    // 9. Write users
    for (const item of usersList) {
      await setDoc(doc(db, 'users', item.id), item, { merge: true });
    }

    // Update last sync time
    const updatedSettings = {
      ...settings,
      lastSyncCloud: new Date().toISOString(),
    };
    StorageService.savePengaturan(updatedSettings);

    _isCloudOnline = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porseni_cloud_synced'));
    }

    return {
      success: true,
      message: 'Seluruh data berhasil disinkronkan ke Database Cloud!',
      counts: {
        lembaga: lembagaList.length,
        peserta: pesertaList.length,
        cabang: cabangList.length,
      },
    };
  } catch (error) {
    console.error('Upload to Firestore error:', error);
    return {
      success: false,
      message: `Gagal sinkronisasi ke cloud: ${(error as Error).message}`,
      counts: { lembaga: 0, peserta: 0, cabang: 0 },
    };
  }
}

/**
 * Download all records from Firebase Firestore to local storage (Pull from Cloud).
 * If Cloud Firestore has zero records (e.g. freshly created database), automatically
 * seeds Firestore from local initial storage so cloud data is immediately available to all devices!
 */
export async function downloadAllFromFirestore(): Promise<{
  success: boolean;
  message: string;
  counts: { lembaga: number; peserta: number; cabang: number };
}> {
  try {
    // 1. Fetch Lembaga
    const lembagaSnap = await getDocs(collection(db, 'lembaga'));
    const lembagaList: Lembaga[] = [];
    lembagaSnap.forEach(d => {
      lembagaList.push(d.data() as Lembaga);
    });

    // 2. Fetch Peserta
    const pesertaSnap = await getDocs(collection(db, 'peserta'));
    const pesertaList: Peserta[] = [];
    pesertaSnap.forEach(d => {
      pesertaList.push(d.data() as Peserta);
    });

    // 3. Fetch Cabang
    const cabangSnap = await getDocs(collection(db, 'cabang'));
    const cabangList: CabangLomba[] = [];
    cabangSnap.forEach(d => {
      cabangList.push(d.data() as CabangLomba);
    });

    // 4. Fetch Pengaturan
    const configSnap = await getDocs(collection(db, 'pengaturan'));
    let cloudSettings: PengaturanSistem | null = null;
    configSnap.forEach(d => {
      if (d.id === 'global') {
        cloudSettings = d.data() as PengaturanSistem;
      }
    });

    // 5. Fetch Pengumuman
    const pengumumanSnap = await getDocs(collection(db, 'pengumuman'));
    const pengumumanList: Pengumuman[] = [];
    pengumumanSnap.forEach(d => {
      pengumumanList.push(d.data() as Pengumuman);
    });

    // 6. Fetch Jadwal
    const jadwalSnap = await getDocs(collection(db, 'jadwal'));
    const jadwalList: JadwalKegiatan[] = [];
    jadwalSnap.forEach(d => {
      jadwalList.push(d.data() as JadwalKegiatan);
    });

    // 7. Fetch Foto
    const fotoSnap = await getDocs(collection(db, 'foto_kegiatan'));
    const fotoList: FotoKegiatan[] = [];
    fotoSnap.forEach(d => {
      fotoList.push(d.data() as FotoKegiatan);
    });

    // 8. Fetch Video
    const videoSnap = await getDocs(collection(db, 'video_kegiatan'));
    const videoList: VideoKegiatan[] = [];
    videoSnap.forEach(d => {
      videoList.push(d.data() as VideoKegiatan);
    });

    // 9. Fetch Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersList: User[] = [];
    usersSnap.forEach(d => {
      usersList.push(d.data() as User);
    });

    // CHECK SEED CONDITION:
    // If Cloud is currently empty, seed Cloud with local baseline so other devices immediately see the data!
    if (lembagaList.length === 0 && pesertaList.length === 0) {
      console.log('[Firebase] Cloud database is empty, bootstrapping from local records...');
      await uploadAllToFirestore();
      return {
        success: true,
        message: 'Database Cloud berhasil diinisialisasi dan siap digunakan secara online!',
        counts: {
          lembaga: StorageService.getLembaga().length,
          peserta: StorageService.getPeserta().length,
          cabang: StorageService.getCabang().length,
        },
      };
    }

    // Save fetched cloud records into local cache
    if (lembagaList.length > 0) {
      StorageService.setItems('porseni_lembaga_v1', lembagaList);
    }
    if (pesertaList.length > 0) {
      StorageService.setItems('porseni_peserta_v1', pesertaList);
    }
    if (cabangList.length > 0) {
      StorageService.setItems('porseni_cabang_v1', cabangList);
    }
    if (pengumumanList.length > 0) {
      StorageService.setItems('porseni_pengumuman_v1', pengumumanList);
    }
    if (jadwalList.length > 0) {
      StorageService.setItems('porseni_jadwal_v1', jadwalList);
    }
    if (fotoList.length > 0) {
      StorageService.setItems('porseni_foto_kegiatan_v1', fotoList);
    }
    if (videoList.length > 0) {
      StorageService.setItems('porseni_video_kegiatan_v1', videoList);
    }
    if (usersList.length > 0) {
      StorageService.setItems('porseni_users_v1', usersList);
    }
    if (cloudSettings) {
      const activeSettings = StorageService.getPengaturan();
      StorageService.savePengaturan({
        ...activeSettings,
        ...(cloudSettings as Record<string, any>),
        lastSyncCloud: new Date().toISOString(),
      });
    }

    _isCloudOnline = true;

    // Trigger local update notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porseni_cloud_synced'));
      window.dispatchEvent(new CustomEvent('porseni_foto_updated'));
      window.dispatchEvent(new CustomEvent('porseni_video_updated'));
    }

    return {
      success: true,
      message: 'Data terbaru dari Cloud berhasil ditarik ke perangkat ini!',
      counts: {
        lembaga: lembagaList.length,
        peserta: pesertaList.length,
        cabang: cabangList.length,
      },
    };
  } catch (error) {
    console.error('Download from Firestore error:', error);
    return {
      success: false,
      message: `Gagal menarik data dari cloud: ${(error as Error).message}`,
      counts: { lembaga: 0, peserta: 0, cabang: 0 },
    };
  }
}

/**
 * Subscribe to real-time updates from Firestore for multi-device sync
 * When ANY device updates data in Firestore, all other devices receive the update
 * instantly through the onSnapshot WebSocket listener and refresh their views seamlessly.
 */
export function setupRealtimeSync(onUpdate: () => void): () => void {
  const unsubs: (() => void)[] = [];

  try {
    // 1. Peserta listener
    const unsubPeserta = onSnapshot(collection(db, 'peserta'), snap => {
      if (!snap.empty) {
        const list: Peserta[] = [];
        snap.forEach(d => list.push(d.data() as Peserta));
        StorageService.setItems('porseni_peserta_v1', list);
        onUpdate();
      }
    }, err => {
      console.warn('Realtime Peserta listener error:', err);
    });
    unsubs.push(unsubPeserta);

    // 2. Lembaga listener
    const unsubLembaga = onSnapshot(collection(db, 'lembaga'), snap => {
      if (!snap.empty) {
        const list: Lembaga[] = [];
        snap.forEach(d => list.push(d.data() as Lembaga));
        StorageService.setItems('porseni_lembaga_v1', list);
        onUpdate();
      }
    }, err => {
      console.warn('Realtime Lembaga listener error:', err);
    });
    unsubs.push(unsubLembaga);

    // 3. Cabang Lomba listener
    const unsubCabang = onSnapshot(collection(db, 'cabang'), snap => {
      if (!snap.empty) {
        const list: CabangLomba[] = [];
        snap.forEach(d => list.push(d.data() as CabangLomba));
        StorageService.setItems('porseni_cabang_v1', list);
        onUpdate();
      }
    }, err => {
      console.warn('Realtime Cabang listener error:', err);
    });
    unsubs.push(unsubCabang);

    // 4. Pengaturan Sistem listener
    const unsubPengaturan = onSnapshot(collection(db, 'pengaturan'), snap => {
      snap.forEach(d => {
        if (d.id === 'global') {
          const cloudConfig = d.data() as PengaturanSistem;
          const currentConfig = StorageService.getPengaturan();
          StorageService.savePengaturan({
            ...currentConfig,
            ...cloudConfig,
          });
          onUpdate();
        }
      });
    }, err => {
      console.warn('Realtime Pengaturan listener error:', err);
    });
    unsubs.push(unsubPengaturan);

    // 5. Pengumuman listener
    const unsubPengumuman = onSnapshot(collection(db, 'pengumuman'), snap => {
      if (!snap.empty) {
        const list: Pengumuman[] = [];
        snap.forEach(d => list.push(d.data() as Pengumuman));
        StorageService.setItems('porseni_pengumuman_v1', list);
        onUpdate();
      }
    }, err => {
      console.warn('Realtime Pengumuman listener error:', err);
    });
    unsubs.push(unsubPengumuman);

    // 6. Jadwal Kegiatan listener
    const unsubJadwal = onSnapshot(collection(db, 'jadwal'), snap => {
      if (!snap.empty) {
        const list: JadwalKegiatan[] = [];
        snap.forEach(d => list.push(d.data() as JadwalKegiatan));
        StorageService.setItems('porseni_jadwal_v1', list);
        onUpdate();
      }
    }, err => {
      console.warn('Realtime Jadwal listener error:', err);
    });
    unsubs.push(unsubJadwal);

    // 7. Foto Kegiatan listener
    const unsubFoto = onSnapshot(collection(db, 'foto_kegiatan'), snap => {
      if (!snap.empty) {
        const list: FotoKegiatan[] = [];
        snap.forEach(d => list.push(d.data() as FotoKegiatan));
        StorageService.setItems('porseni_foto_kegiatan_v1', list);
        onUpdate();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('porseni_foto_updated'));
        }
      }
    }, err => {
      console.warn('Realtime Foto listener error:', err);
    });
    unsubs.push(unsubFoto);

    // 8. Video Kegiatan listener
    const unsubVideo = onSnapshot(collection(db, 'video_kegiatan'), snap => {
      if (!snap.empty) {
        const list: VideoKegiatan[] = [];
        snap.forEach(d => list.push(d.data() as VideoKegiatan));
        StorageService.setItems('porseni_video_kegiatan_v1', list);
        onUpdate();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('porseni_video_updated'));
        }
      }
    }, err => {
      console.warn('Realtime Video listener error:', err);
    });
    unsubs.push(unsubVideo);

    _isCloudOnline = true;
    return () => {
      unsubs.forEach(unsub => {
        try {
          unsub();
        } catch {
          // ignore
        }
      });
    };
  } catch (err) {
    console.warn('Realtime listener fallback:', err);
    return () => {};
  }
}
