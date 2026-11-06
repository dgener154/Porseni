import {
  AuditLog,
  CabangLomba,
  FotoKegiatan,
  VideoKegiatan,
  JadwalKegiatan,
  Lembaga,
  PengaturanSistem,
  Pengumuman,
  Periode,
  Peserta,
  User,
  ResetDatabaseOptions,
  DatabaseCounts,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'porseni_users_v1',
  LEMBAGA: 'porseni_lembaga_v1',
  CABANG: 'porseni_cabang_v1',
  PESERTA: 'porseni_peserta_v1',
  PENGUMUMAN: 'porseni_pengumuman_v1',
  JADWAL: 'porseni_jadwal_v1',
  FOTO_KEGIATAN: 'porseni_foto_kegiatan_v1',
  VIDEO_KEGIATAN: 'porseni_video_kegiatan_v1',
  PENGATURAN: 'porseni_pengaturan_v1',
  PERIODE: 'porseni_periode_v1',
  AUDIT_LOGS: 'porseni_audit_logs_v1',
  SESSION: 'porseni_session_v1',
  RESET_TOKENS: 'porseni_reset_tokens_v1',
};

// Simple secure hash simulation using Web Crypto API or fallback
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_porseni_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for environments without subtle crypto
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
}

// Initial default configuration (neutral, universal, customizable)
const defaultPengaturan: PengaturanSistem = {
  namaWebsite: 'PORSENI DIGITAL',
  namaPorseni: 'PEKAN OLAHRAGA DAN SENI (PORSENI)',
  logoUrl: undefined,
  tahun: '2026',
  tema: 'Sportifitas Mengukir Prestasi, Seni Memperhalus Budi Pekerti',
  namaPenyelenggara: 'Panitia Pelaksana PORSENI',
  tingkatWilayah: 'Tingkat Wilayah / Pelaksana',
  alamat: 'Jl. Merdeka Pemuda No. 45, Gedung Olahraga & Seni Budaya',
  email: 'sekretariat@porseni-digital.id',
  telepon: '0812-3456-7890',
  website: 'https://porseni-digital.id',
  mediaSosial: {
    instagram: '@porseni.digital',
    youtube: 'Porseni Digital Official',
    facebook: 'Porseni Indonesia',
  },
  statusPendaftaran: true,
  batasPendaftaran: '2026-09-15T23:59:59',
  statusMaintenance: false,
  aktifPeriodeId: 'PRD-2026',
  ketentuanUmum: 'Peserta adalah siswa/siswi aktif yang terdaftar di lembaga resmi dan memiliki NISN valid. Setiap peserta hanya diperkenankan mengikuti 1 cabang olahraga atau 1 cabang seni.',
  tujuanKegiatan: 'Mempererat persaudaraan antar lembaga pendidikan, memfasilitasi talenta unggul di bidang keolahragaan dan kesenian, serta menanamkan karakter jujur, sportif, dan berdaya saing.',
};

const defaultFotoKegiatan: FotoKegiatan[] = [];

const defaultVideoKegiatan: VideoKegiatan[] = [];

const defaultPeriode: Periode[] = [
  {
    id: 'PRD-2026',
    tahun: '2026',
    nama: 'PORSENI Tingkat Nasional 2026',
    tema: 'Sportifitas Mengukir Prestasi, Seni Memperhalus Budi Pekerti',
    status: 'AKTIF',
  },
  {
    id: 'PRD-2025',
    tahun: '2025',
    nama: 'PORSENI Tingkat Wilayah 2025',
    tema: 'Generasi Emas Berprestasi untuk Negeri',
    status: 'ARSIP',
  },
];

const defaultCabang: CabangLomba[] = [
  {
    id: 'CB-001',
    kode: 'OL-FUT-PA',
    nama: 'Futsal Tingkat MA/SMA',
    kategori: 'OLAHRAGA',
    jenis: 'BEREGU',
    gender: 'PUTRA',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 10,
    kuotaMin: 5,
    persyaratan: 'Peserta kelas X-XII aktif. Membawa pelindung tulang kering (shinguard).',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar', 'Akta Kelahiran / KK', 'Surat Keterangan Dokter'],
    status: 'AKTIF',
    lokasi: 'Gedung Olahraga (GOR) Gelora Nusantara',
    jadwalPelaksanaan: '25-28 September 2026',
  },
  {
    id: 'CB-002',
    kode: 'OL-VOL-PI',
    nama: 'Bola Voli Putri',
    kategori: 'OLAHRAGA',
    jenis: 'BEREGU',
    gender: 'PUTRI',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 8,
    kuotaMin: 6,
    persyaratan: 'Peserta putri aktif. Seragam kontingen seragam dengan nomor dada dan punggung.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar', 'Akta Kelahiran / KK'],
    status: 'AKTIF',
    lokasi: 'Lapangan Voli Sport Center A',
    jadwalPelaksanaan: '25-27 September 2026',
  },
  {
    id: 'CB-003',
    kode: 'OL-BDM-PA',
    nama: 'Bulutangkis Tunggal Putra',
    kategori: 'OLAHRAGA',
    jenis: 'INDIVIDU',
    gender: 'PUTRA',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 2,
    kuotaMin: 1,
    persyaratan: 'Sistem gugur BWF. Membawa raket masing-masing.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar', 'Rapor Terakhir'],
    status: 'AKTIF',
    lokasi: 'Hall Bulutangkis Juara',
    jadwalPelaksanaan: '26-27 September 2026',
  },
  {
    id: 'CB-004',
    kode: 'OL-TNS-PA',
    nama: 'Tenis Meja Tunggal Putra',
    kategori: 'OLAHRAGA',
    jenis: 'INDIVIDU',
    gender: 'PUTRA',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 2,
    kuotaMin: 1,
    persyaratan: 'Standar ITTF. Bet berlapis karet dua sisi standar.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar'],
    status: 'AKTIF',
    lokasi: 'Hall Tenis Meja Gedung B',
    jadwalPelaksanaan: '26 September 2026',
  },
  {
    id: 'CB-005',
    kode: 'SN-MTQ-PA',
    nama: 'Musabaqah Tilawatil Qur\'an (MTQ) Putra',
    kategori: 'SENI',
    jenis: 'INDIVIDU',
    gender: 'PUTRA',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 1,
    kuotaMin: 1,
    persyaratan: 'Membaca maqra yang diundi saat Technical Meeting. Durasi 7-9 menit.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar', 'Akta Kelahiran'],
    status: 'AKTIF',
    lokasi: 'Auditorium Utama Islamic Center',
    jadwalPelaksanaan: '26 September 2026',
  },
  {
    id: 'CB-006',
    kode: 'SN-MTQ-PI',
    nama: 'Musabaqah Tilawatil Qur\'an (MTQ) Putri',
    kategori: 'SENI',
    jenis: 'INDIVIDU',
    gender: 'PUTRI',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 1,
    kuotaMin: 1,
    persyaratan: 'Membaca maqra yang diundi saat Technical Meeting. Durasi 7-9 menit.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar', 'Akta Kelahiran'],
    status: 'AKTIF',
    lokasi: 'Auditorium Utama Islamic Center',
    jadwalPelaksanaan: '26 September 2026',
  },
  {
    id: 'CB-007',
    kode: 'SN-KLG-CMP',
    nama: 'Kaligrafi Islam Kontemporer',
    kategori: 'SENI',
    jenis: 'INDIVIDU',
    gender: 'CAMPURAN',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 2,
    kuotaMin: 1,
    persyaratan: 'Kanvas 60x80cm disediakan panitia. Cat dan kuas dibawa peserta. Durasi 4 jam.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar'],
    status: 'AKTIF',
    lokasi: 'Selasar Galeri Seni Budaya',
    jadwalPelaksanaan: '27 September 2026',
  },
  {
    id: 'CB-008',
    kode: 'SN-PST-CMP',
    nama: 'Desain Poster Digital Edukasi',
    kategori: 'SENI',
    jenis: 'INDIVIDU',
    gender: 'CAMPURAN',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 2,
    kuotaMin: 1,
    persyaratan: 'Pengerjaan on the spot di Lab Komputer. Menggunakan software open source / Adobe.',
    dokumenWajib: ['Foto Resmi 3x4', 'Kartu Pelajar'],
    status: 'AKTIF',
    lokasi: 'Laboratorium Multimedia Gedung C',
    jadwalPelaksanaan: '27 September 2026',
  },
];

const defaultJadwal: JadwalKegiatan[] = [
  {
    id: 'JDW-01',
    kegiatan: 'Sosialisasi & Pendaftaran Lembaga',
    mulai: '2026-08-01',
    selesai: '2026-08-20',
    keterangan: 'Lembaga mendaftar melalui portal porseni digital dan mengunggah SK mandat.',
    status: 'SELESAI',
    tahap: 1,
  },
  {
    id: 'JDW-02',
    kegiatan: 'Verifikasi & Validasi Lembaga oleh Panitia',
    mulai: '2026-08-10',
    selesai: '2026-08-25',
    keterangan: 'Pemeriksaan keabsahan lembaga, NPSN/NSM, dan penetapan status aktif.',
    status: 'SELESAI',
    tahap: 2,
  },
  {
    id: 'JDW-03',
    kegiatan: 'Pendaftaran Peserta & Unggah Berkas Persyaratan',
    mulai: '2026-08-20',
    selesai: '2026-09-15',
    keterangan: 'Input data atlet/seniman, foto, NISN, kartu pelajar, dan surat sehat.',
    status: 'BERLANGSUNG',
    tahap: 3,
  },
  {
    id: 'JDW-04',
    kegiatan: 'Verifikasi Berkas & Pengesahan Peserta',
    mulai: '2026-09-01',
    selesai: '2026-09-18',
    keterangan: 'Panitia memeriksa berkas, menyetujui, meminta perbaikan, atau menolak.',
    status: 'BERLANGSUNG',
    tahap: 4,
  },
  {
    id: 'JDW-05',
    kegiatan: 'Technical Meeting & Pengundian Nomor Tanding',
    mulai: '2026-09-22',
    selesai: '2026-09-22',
    keterangan: 'Penetapan bagan pertandingan, peraturan teknis, dan cetak kartu peserta.',
    status: 'AKAN DATANG',
    tahap: 5,
  },
  {
    id: 'JDW-06',
    kegiatan: 'Pelaksanaan Lomba & Pertandingan Akbar',
    mulai: '2026-09-25',
    selesai: '2026-09-30',
    keterangan: 'Seluruh cabang olahraga dan seni dilaksanakan serempak di venue terpilih.',
    status: 'AKAN DATANG',
    tahap: 6,
  },
  {
    id: 'JDW-07',
    kegiatan: 'Upacara Penutupan & Penganugerahan Juara Umum',
    mulai: '2026-10-01',
    selesai: '2026-10-01',
    keterangan: 'Penyerahan piala bergilir Menteri dan medali penghargaan para juara.',
    status: 'AKAN DATANG',
    tahap: 7,
  },
];

const defaultPengumuman: Pengumuman[] = [
  {
    id: 'ANN-001',
    judul: 'Petunjuk Teknis (Juknis) Resmi PORSENI Nasional 2026',
    isi: 'Diberitahukan kepada seluruh pimpinan lembaga dan operator kontingen bahwa Petunjuk Teknis Pelaksanaan PORSENI 2026 telah diterbitkan secara resmi. Silakan unduh dokumen panduan untuk mempelajari regulasi setiap nomor lomba olahraga dan seni.',
    tanggal: '2026-08-15',
    kategori: 'PENTING',
    lampiranNama: 'Juknis_PORSENI_Nasional_2026_Resmi.pdf',
    lampiranUrl: '#',
    status: 'PUBLISHED',
    isNew: true,
    target: 'SEMUA',
  },
  {
    id: 'ANN-002',
    judul: 'Batas Akhir Unggah Berkas & Perbaikan Data Peserta',
    isi: 'Panitia mengimbau seluruh lembaga terdaftar untuk menyelesaikan unggah berkas wajib (Foto 3x4, Kartu Pelajar, Akta/KK) paling lambat tanggal 15 September 2026 pukul 23.59 WIB. Setelah batas waktu tersebut, sistem pendaftaran akan dikunci untuk persiapan bagan undian.',
    tanggal: '2026-09-01',
    kategori: 'JADWAL',
    status: 'PUBLISHED',
    isNew: true,
    target: 'LEMBAGA',
  },
  {
    id: 'ANN-003',
    judul: 'Informasi Ketentuan Seragam & Nomor Punggung Cabang Olahraga',
    isi: 'Seluruh kontingen cabang olahraga wajib memperhatikan keseragaman warna kostum tanding serta nomor punggung 1-99 yang tidak boleh berganti selama kejuaraan berlangsung.',
    tanggal: '2026-09-05',
    kategori: 'UMUM',
    status: 'PUBLISHED',
    isNew: false,
    target: 'SEMUA',
  },
];

const defaultLembaga: Lembaga[] = [];

const defaultPeserta: Peserta[] = [];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'LOG-00001',
    timestamp: new Date().toISOString(),
    user: 'SYSTEM',
    role: 'SISTEM',
    aktivitas: 'Inisialisasi Sistem PORSENI Digital',
    rincian: 'Sistem informasi resmi PORSENI Digital siap digunakan untuk operasional resmi.',
    ip: '127.0.0.1',
    status: 'SUKSES',
  },
];

// Database Repository Class
export class StorageService {
  private static isInitialized = false;

  public static async init() {
    if (this.isInitialized) return;

    const PRODUCTION_CLEAN_KEY = 'porseni_production_ready_v3';

    // One-time purge of old dummy/sample test data
    if (!localStorage.getItem(PRODUCTION_CLEAN_KEY)) {
      localStorage.removeItem(STORAGE_KEYS.PESERTA);
      localStorage.removeItem(STORAGE_KEYS.LEMBAGA);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.FOTO_KEGIATAN);
      localStorage.removeItem(STORAGE_KEYS.VIDEO_KEGIATAN);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.setItem(PRODUCTION_CLEAN_KEY, 'true');
    }

    if (!localStorage.getItem(STORAGE_KEYS.PENGATURAN)) {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(defaultPengaturan));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERIODE)) {
      localStorage.setItem(STORAGE_KEYS.PERIODE, JSON.stringify(defaultPeriode));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CABANG)) {
      localStorage.setItem(STORAGE_KEYS.CABANG, JSON.stringify(defaultCabang));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JADWAL)) {
      localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(defaultJadwal));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PENGUMUMAN)) {
      localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(defaultPengumuman));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOTO_KEGIATAN)) {
      localStorage.setItem(STORAGE_KEYS.FOTO_KEGIATAN, JSON.stringify(defaultFotoKegiatan));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VIDEO_KEGIATAN)) {
      localStorage.setItem(STORAGE_KEYS.VIDEO_KEGIATAN, JSON.stringify(defaultVideoKegiatan));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultAuditLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEMBAGA)) {
      localStorage.setItem(STORAGE_KEYS.LEMBAGA, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PESERTA)) {
      localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify([]));
    }

    // Default official Admin credentials: admin@porseni.go.id / mkkmmtssby@2020
    const targetAdminHash = await hashPassword('mkkmmtssby@2020');

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const defaultUsers: User[] = [
        {
          id: 'USR-ADMIN-01',
          username: 'admin',
          email: 'admin@porseni.go.id',
          passwordHash: targetAdminHash,
          role: 'ADMIN',
          namaLengkap: 'Administrator Panitia Pelaksana PORSENI',
          createdAt: '2026-08-01T00:00:00Z',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    } else {
      // Ensure admin account always has official email and password
      const users = this.getItems<User>(STORAGE_KEYS.USERS);
      let adminFound = false;
      const filtered = users
        // Filter out any dummy operators if present
        .filter(u => !(u.role === 'LEMBAGA' && (u.username.includes('man1malang') || u.username.includes('sman3surabaya') || u.username.includes('mtsn2bandung'))))
        .map(u => {
          if (u.role === 'ADMIN' && (u.username === 'admin' || u.email === 'admin@porseni.go.id')) {
            adminFound = true;
            return {
              ...u,
              email: 'admin@porseni.go.id',
              passwordHash: targetAdminHash,
            };
          }
          return u;
        });

      if (!adminFound) {
        filtered.unshift({
          id: 'USR-ADMIN-01',
          username: 'admin',
          email: 'admin@porseni.go.id',
          passwordHash: targetAdminHash,
          role: 'ADMIN',
          namaLengkap: 'Administrator Panitia Pelaksana PORSENI',
          createdAt: '2026-08-01T00:00:00Z',
        });
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    }

    this.isInitialized = true;
  }

  // Generic getter and setter
  private static getItems<T>(key: string, defaultVal: T[] = []): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  public static setItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
  }

  // --- CLOUD SYNC BRIDGE ---
  private static cloudSyncHandler: ((action: 'set' | 'delete', collection: string, id: string, data?: any) => void) | null = null;

  public static setCloudSyncHandler(handler: (action: 'set' | 'delete', collection: string, id: string, data?: any) => void): void {
    this.cloudSyncHandler = handler;
  }

  public static notifyCloudSync(action: 'set' | 'delete', collection: string, id: string, data?: any): void {
    if (this.cloudSyncHandler) {
      try {
        this.cloudSyncHandler(action, collection, id, data);
      } catch (e) {
        console.warn('[CloudSyncBridge] Failed to dispatch cloud sync:', e);
      }
    }
  }

  // --- AUDIT LOGS ---
  public static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const logs = this.getItems<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `LOG-${String(logs.length + 1).padStart(5, '0')}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    logs.unshift(newLog);
    // Keep last 1000 logs
    if (logs.length > 1000) logs.pop();
    this.setItems(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  public static getAuditLogs(): AuditLog[] {
    return this.getItems<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
  }

  // --- USERS ---
  public static getUsers(): User[] {
    return this.getItems<User>(STORAGE_KEYS.USERS);
  }

  public static saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setItems(STORAGE_KEYS.USERS, users);
    this.notifyCloudSync('set', 'users', user.id, user);
  }

  // --- LEMBAGA ---
  public static getLembaga(): Lembaga[] {
    return this.getItems<Lembaga>(STORAGE_KEYS.LEMBAGA);
  }

  public static getLembagaById(id: string): Lembaga | undefined {
    return this.getLembaga().find(l => l.id === id);
  }

  public static generateLembagaId(): string {
    const currentYear = new Date().getFullYear();
    const list = this.getLembaga();
    const maxNum = list.reduce((acc, curr) => {
      const match = curr.id.match(/LG-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0);
    return `LG-${currentYear}-${String(maxNum + 1).padStart(5, '0')}`;
  }

  public static saveLembaga(lembaga: Lembaga): void {
    const list = this.getLembaga();
    const index = list.findIndex(l => l.id === lembaga.id);
    let targetLembaga = lembaga;
    if (index >= 0) {
      targetLembaga = { ...lembaga, updatedAt: new Date().toISOString() };
      list[index] = targetLembaga;
    } else {
      list.push(targetLembaga);
    }
    this.setItems(STORAGE_KEYS.LEMBAGA, list);
    this.notifyCloudSync('set', 'lembaga', targetLembaga.id, targetLembaga);
  }

  public static deleteLembaga(id: string): void {
    const list = this.getLembaga().filter(l => l.id !== id);
    this.setItems(STORAGE_KEYS.LEMBAGA, list);
    this.notifyCloudSync('delete', 'lembaga', id);
    // Also remove associated user
    const users = this.getUsers().filter(u => u.lembagaId !== id);
    this.setItems(STORAGE_KEYS.USERS, users);
    // Also remove associated participants
    const peserta = this.getPeserta().filter(p => p.lembagaId !== id);
    this.setItems(STORAGE_KEYS.PESERTA, peserta);
  }

  // --- CABANG LOMBA ---
  public static getCabang(): CabangLomba[] {
    return this.getItems<CabangLomba>(STORAGE_KEYS.CABANG);
  }

  public static getCabangById(id: string): CabangLomba | undefined {
    return this.getCabang().find(c => c.id === id);
  }

  public static saveCabang(cabang: CabangLomba): void {
    const list = this.getCabang();
    const index = list.findIndex(c => c.id === cabang.id);
    if (index >= 0) {
      list[index] = cabang;
    } else {
      list.push(cabang);
    }
    this.setItems(STORAGE_KEYS.CABANG, list);
    this.notifyCloudSync('set', 'cabang', cabang.id, cabang);
  }

  public static deleteCabang(id: string): void {
    const list = this.getCabang().filter(c => c.id !== id);
    this.setItems(STORAGE_KEYS.CABANG, list);
    this.notifyCloudSync('delete', 'cabang', id);
  }

  // --- PESERTA ---
  public static getPeserta(): Peserta[] {
    return this.getItems<Peserta>(STORAGE_KEYS.PESERTA);
  }

  public static getPesertaById(id: string): Peserta | undefined {
    const clean = id.trim().toLowerCase();
    return this.getPeserta().find(
      p =>
        p.id.toLowerCase() === clean ||
        p.nomorPeserta.toLowerCase() === clean ||
        p.nisn.toLowerCase() === clean ||
        p.nik.toLowerCase() === clean ||
        p.nis.toLowerCase() === clean
    );
  }

  public static getPesertaByLembaga(lembagaId: string): Peserta[] {
    return this.getPeserta().filter(p => p.lembagaId === lembagaId);
  }

  public static generatePesertaId(): string {
    const currentYear = new Date().getFullYear();
    const list = this.getPeserta();
    const maxNum = list.reduce((acc, curr) => {
      const match = curr.id.match(/PS-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0);
    return `PS-${currentYear}-${String(maxNum + 1).padStart(5, '0')}`;
  }

  public static generateNomorPeserta(): string {
    const currentYear = new Date().getFullYear();
    const list = this.getPeserta();
    const maxNum = list.reduce((acc, curr) => {
      const match = curr.nomorPeserta.match(/PORSENI-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0);
    return `PORSENI-${currentYear}-${String(maxNum + 1).padStart(5, '0')}`;
  }

  public static savePeserta(peserta: Peserta): void {
    const list = this.getPeserta();
    const index = list.findIndex(p => p.id === peserta.id);
    let targetPeserta = peserta;
    if (index >= 0) {
      targetPeserta = { ...peserta, updatedAt: new Date().toISOString() };
      list[index] = targetPeserta;
    } else {
      list.push(targetPeserta);
    }
    this.setItems(STORAGE_KEYS.PESERTA, list);
    this.notifyCloudSync('set', 'peserta', targetPeserta.id, targetPeserta);
  }

  public static deletePeserta(id: string): void {
    const list = this.getPeserta().filter(p => p.id !== id);
    this.setItems(STORAGE_KEYS.PESERTA, list);
    this.notifyCloudSync('delete', 'peserta', id);
  }

  public static deleteMultiplePeserta(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const list = this.getPeserta().filter(p => !idSet.has(p.id));
    this.setItems(STORAGE_KEYS.PESERTA, list);
    ids.forEach(id => this.notifyCloudSync('delete', 'peserta', id));
  }

  // --- PENGUMUMAN ---
  public static getPengumuman(): Pengumuman[] {
    return this.getItems<Pengumuman>(STORAGE_KEYS.PENGUMUMAN);
  }

  public static savePengumuman(p: Pengumuman): void {
    const list = this.getPengumuman();
    const index = list.findIndex(item => item.id === p.id);
    if (index >= 0) {
      list[index] = p;
    } else {
      list.unshift(p);
    }
    this.setItems(STORAGE_KEYS.PENGUMUMAN, list);
    this.notifyCloudSync('set', 'pengumuman', p.id, p);
  }

  public static deletePengumuman(id: string): void {
    const list = this.getPengumuman().filter(p => p.id !== id);
    this.setItems(STORAGE_KEYS.PENGUMUMAN, list);
    this.notifyCloudSync('delete', 'pengumuman', id);
  }

  // --- JADWAL ---
  public static getJadwal(): JadwalKegiatan[] {
    return this.getItems<JadwalKegiatan>(STORAGE_KEYS.JADWAL);
  }

  public static saveJadwal(j: JadwalKegiatan): void {
    const list = this.getJadwal();
    const index = list.findIndex(item => item.id === j.id);
    if (index >= 0) {
      list[index] = j;
    } else {
      list.push(j);
    }
    this.setItems(STORAGE_KEYS.JADWAL, list);
    this.notifyCloudSync('set', 'jadwal', j.id, j);
  }

  public static deleteJadwal(id: string): void {
    const list = this.getJadwal().filter(j => j.id !== id);
    this.setItems(STORAGE_KEYS.JADWAL, list);
    this.notifyCloudSync('delete', 'jadwal', id);
  }

  // --- FOTO KEGIATAN ---
  public static getFotoKegiatan(): FotoKegiatan[] {
    return this.getItems<FotoKegiatan>(STORAGE_KEYS.FOTO_KEGIATAN, defaultFotoKegiatan);
  }

  public static saveFotoKegiatan(f: FotoKegiatan): void {
    const list = this.getFotoKegiatan();
    const index = list.findIndex(item => item.id === f.id);
    if (index >= 0) {
      list[index] = f;
    } else {
      list.unshift(f);
    }
    this.setItems(STORAGE_KEYS.FOTO_KEGIATAN, list);
    this.notifyCloudSync('set', 'foto_kegiatan', f.id, f);
    try {
      window.dispatchEvent(new CustomEvent('porseni_foto_updated'));
    } catch {
      // ignore
    }
  }

  public static deleteFotoKegiatan(id: string): void {
    const list = this.getFotoKegiatan().filter(f => f.id !== id);
    this.setItems(STORAGE_KEYS.FOTO_KEGIATAN, list);
    this.notifyCloudSync('delete', 'foto_kegiatan', id);
    try {
      window.dispatchEvent(new CustomEvent('porseni_foto_updated'));
    } catch {
      // ignore
    }
  }

  // --- VIDEO KEGIATAN ---
  public static getVideoKegiatan(): VideoKegiatan[] {
    return this.getItems<VideoKegiatan>(STORAGE_KEYS.VIDEO_KEGIATAN, defaultVideoKegiatan);
  }

  public static getVideoKegiatanById(id: string): VideoKegiatan | undefined {
    return this.getVideoKegiatan().find(v => v.id === id);
  }

  public static saveVideoKegiatan(v: VideoKegiatan): void {
    const list = this.getVideoKegiatan();
    const index = list.findIndex(item => item.id === v.id);
    if (index >= 0) {
      list[index] = v;
    } else {
      list.unshift(v);
    }
    this.setItems(STORAGE_KEYS.VIDEO_KEGIATAN, list);
    this.notifyCloudSync('set', 'video_kegiatan', v.id, v);
    try {
      window.dispatchEvent(new CustomEvent('porseni_video_updated'));
    } catch {
      // ignore
    }
  }

  public static deleteVideoKegiatan(id: string): void {
    const list = this.getVideoKegiatan().filter(v => v.id !== id);
    this.setItems(STORAGE_KEYS.VIDEO_KEGIATAN, list);
    this.notifyCloudSync('delete', 'video_kegiatan', id);
    try {
      window.dispatchEvent(new CustomEvent('porseni_video_updated'));
    } catch {
      // ignore
    }
  }

  // --- PENGATURAN & PERIODE ---
  public static getPengaturan(): PengaturanSistem {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
      return data ? JSON.parse(data) : defaultPengaturan;
    } catch {
      return defaultPengaturan;
    }
  }

  public static savePengaturan(settings: PengaturanSistem, skipCloudSync = false): void {
    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(settings));
    if (!skipCloudSync) {
      this.notifyCloudSync('set', 'pengaturan', 'global', settings);
    }
    try {
      window.dispatchEvent(
        new CustomEvent('porseni_pengaturan_updated', { detail: settings })
      );
    } catch {
      // Ignore in non-browser env
    }
  }

  public static getPeriode(): Periode[] {
    return this.getItems<Periode>(STORAGE_KEYS.PERIODE);
  }

  public static savePeriode(periode: Periode): void {
    const list = this.getPeriode();
    const index = list.findIndex(p => p.id === periode.id);
    if (index >= 0) {
      list[index] = periode;
    } else {
      list.push(periode);
    }
    this.setItems(STORAGE_KEYS.PERIODE, list);
  }

  // --- BACKUP & RESTORE ---
  public static exportFullBackup(): string {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      pengaturan: this.getPengaturan(),
      periode: this.getPeriode(),
      cabang: this.getCabang(),
      jadwal: this.getJadwal(),
      pengumuman: this.getPengumuman(),
      foto: this.getFotoKegiatan(),
      video: this.getVideoKegiatan(),
      lembaga: this.getLembaga(),
      peserta: this.getPeserta(),
      users: this.getUsers(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public static importFullBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.pengaturan || !data.lembaga || !data.peserta) {
        return { success: false, message: 'Format file cadangan tidak valid atau rusak.' };
      }

      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(data.pengaturan));
      if (data.periode) localStorage.setItem(STORAGE_KEYS.PERIODE, JSON.stringify(data.periode));
      if (data.cabang) localStorage.setItem(STORAGE_KEYS.CABANG, JSON.stringify(data.cabang));
      if (data.jadwal) localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(data.jadwal));
      if (data.pengumuman) localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(data.pengumuman));
      if (data.foto) localStorage.setItem(STORAGE_KEYS.FOTO_KEGIATAN, JSON.stringify(data.foto));
      if (data.video) localStorage.setItem(STORAGE_KEYS.VIDEO_KEGIATAN, JSON.stringify(data.video));
      if (data.lembaga) localStorage.setItem(STORAGE_KEYS.LEMBAGA, JSON.stringify(data.lembaga));
      if (data.peserta) localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(data.peserta));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));

      this.addAuditLog({
        user: 'admin',
        role: 'ADMIN',
        aktivitas: 'Pemulihan Data Cadangan (Restore)',
        rincian: 'Data sistem berhasil dipulihkan dari file backup eksternal.',
        ip: '127.0.0.1',
        status: 'SUKSES',
      });

      try {
        window.dispatchEvent(new CustomEvent('porseni_pengaturan_updated', { detail: data.pengaturan }));
        window.dispatchEvent(new CustomEvent('porseni_cloud_synced'));
      } catch {
        // ignore
      }

      return { success: true, message: 'Data cadangan sistem berhasil dipulihkan secara penuh!' };
    } catch (e: any) {
      return { success: false, message: 'Gagal memproses file: ' + (e.message || 'JSON tidak valid') };
    }
  }

  // Get current record counts for database management & reset control
  public static getDatabaseCounts(): DatabaseCounts {
    const operatorUsers = this.getUsers().filter(u => u.role === 'LEMBAGA');
    return {
      peserta: this.getPeserta().length,
      lembaga: this.getLembaga().length,
      foto: this.getFotoKegiatan().length,
      video: this.getVideoKegiatan().length,
      pengumuman: this.getPengumuman().length,
      jadwal: this.getJadwal().length,
      cabang: this.getCabang().length,
      users: operatorUsers.length,
      auditLogs: this.getAuditLogs().length,
      pengaturan: 1,
    };
  }

  // Granular database reset with checkbox system & safety preservation of admin
  public static resetSelectedDatabase(
    options: ResetDatabaseOptions,
    actor = 'admin'
  ): { success: boolean; clearedCategories: string[]; counts: DatabaseCounts } {
    const cleared: string[] = [];

    // 1. Peserta
    if (options.peserta) {
      this.setItems(STORAGE_KEYS.PESERTA, []);
      cleared.push('Data Peserta');
    }

    // 2. Lembaga
    if (options.lembaga) {
      this.setItems(STORAGE_KEYS.LEMBAGA, []);
      cleared.push('Data Lembaga/Kontingen');
    }

    // 3. Foto Kegiatan
    if (options.foto) {
      this.setItems(STORAGE_KEYS.FOTO_KEGIATAN, []);
      cleared.push('Galeri Foto');
      try {
        window.dispatchEvent(new CustomEvent('porseni_foto_updated'));
      } catch {
        // ignore
      }
    }

    // 4. Video Kegiatan
    if (options.video) {
      this.setItems(STORAGE_KEYS.VIDEO_KEGIATAN, []);
      cleared.push('Galeri Video');
      try {
        window.dispatchEvent(new CustomEvent('porseni_video_updated'));
      } catch {
        // ignore
      }
    }

    // 5. Pengumuman
    if (options.pengumuman) {
      this.setItems(STORAGE_KEYS.PENGUMUMAN, []);
      cleared.push('Pengumuman');
    }

    // 6. Jadwal
    if (options.jadwal) {
      this.setItems(STORAGE_KEYS.JADWAL, []);
      cleared.push('Jadwal Kegiatan');
    }

    // 7. Master Cabang Lomba
    if (options.cabang) {
      this.setItems(STORAGE_KEYS.CABANG, []);
      cleared.push('Master Cabang Lomba');
    }

    // 8. Akun Operator Lembaga (Always preserve ADMIN role so login is never lost!)
    if (options.users) {
      const allUsers = this.getUsers();
      const adminUsers = allUsers.filter(u => u.role === 'ADMIN');
      if (adminUsers.length === 0) {
        adminUsers.push({
          id: 'USR-ADMIN-01',
          username: 'admin',
          email: 'admin@porseni.go.id',
          passwordHash: '',
          role: 'ADMIN',
          namaLengkap: 'Administrator Panitia Pelaksana PORSENI',
          createdAt: new Date().toISOString(),
        });
      }
      this.setItems(STORAGE_KEYS.USERS, adminUsers);
      cleared.push('Akun Operator Lembaga');
    }

    // 9. Pengaturan & Identitas Sistem
    if (options.pengaturan) {
      const current = this.getPengaturan();
      this.savePengaturan({
        ...defaultPengaturan,
        // preserve spreadsheet and cloud keys if already configured
        spreadsheetId: current.spreadsheetId,
        autoSyncCloud: current.autoSyncCloud,
      }, true);
      cleared.push('Pengaturan Sistem');
    }

    // 10. Audit Logs
    if (options.auditLogs) {
      this.setItems(STORAGE_KEYS.AUDIT_LOGS, []);
      cleared.push('Log Audit');
    }

    // Record audit trail of the reset action
    this.addAuditLog({
      user: actor,
      role: 'ADMIN',
      aktivitas: 'Reset Database Sistem',
      rincian: `Berhasil mereset data: ${cleared.join(', ')}`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    try {
      window.dispatchEvent(new CustomEvent('porseni_pengaturan_updated', { detail: this.getPengaturan() }));
      window.dispatchEvent(new CustomEvent('porseni_cloud_synced'));
    } catch {
      // ignore
    }

    return {
      success: true,
      clearedCategories: cleared,
      counts: this.getDatabaseCounts(),
    };
  }

  // Reset to factory defaults
  public static resetToFactoryDefaults(): void {
    localStorage.clear();
    this.isInitialized = false;
    this.init();
    try {
      window.dispatchEvent(new CustomEvent('porseni_pengaturan_updated', { detail: defaultPengaturan }));
      window.dispatchEvent(new CustomEvent('porseni_cloud_synced'));
    } catch {
      // ignore
    }
  }
}
