export type UserRole = 'ADMIN' | 'LEMBAGA';

export type LembagaStatus =
  | 'MENUNGGU VERIFIKASI'
  | 'AKTIF'
  | 'PERLU PERBAIKAN'
  | 'DITOLAK'
  | 'NONAKTIF';

export type PesertaStatus =
  | 'DRAFT'
  | 'MENUNGGU VERIFIKASI'
  | 'PERLU PERBAIKAN'
  | 'TERVERIFIKASI'
  | 'FINAL'
  | 'DITOLAK';

export type KategoriLomba = 'OLAHRAGA' | 'SENI';
export type JenisLomba = 'INDIVIDU' | 'BEREGU';
export type GenderLomba = 'PUTRA' | 'PUTRI' | 'CAMPURAN';
export type JenjangLembaga = 'MI/SD' | 'MTs/SMP' | 'MA/SMA/SMK' | 'PERGURUAN TINGGI';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  lembagaId?: string;
  namaLengkap: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Lembaga {
  id: string; // e.g. LG-2026-00001
  kodeLembaga: string;
  nama: string;
  npsn: string;
  nsm?: string;
  jenjang: JenjangLembaga;
  statusLembaga?: 'NEGERI' | 'SWASTA';
  emailLembaga?: string;
  status: LembagaStatus;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  
  // Data Pimpinan
  pimpinanNama: string;
  pimpinanNip?: string;
  pimpinanHp: string;
  pimpinanEmail: string;

  // Data Operator
  operatorNama: string;
  operatorNik: string;
  operatorHp: string;
  operatorEmail: string;
  username: string;
  passwordHash: string;

  // Berkas
  suratMandatUrl?: string;
  suratMandatNama?: string;
  identitasLembagaUrl?: string;
  identitasLembagaNama?: string;
  dokumenPendukungUrl?: string;
  dokumenPendukungNama?: string;
  logoUrl?: string;

  catatanVerifikasi?: string;
  periodeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CabangLomba {
  id: string; // CB-001
  kode: string;
  nama: string;
  kategori: KategoriLomba;
  jenis: JenisLomba;
  gender: GenderLomba;
  tingkat: string;
  kelompokUmur: string;
  kuotaMaks: number;
  kuotaMin: number;
  persyaratan: string;
  dokumenWajib: string[];
  status: 'AKTIF' | 'NONAKTIF';
  lokasi?: string;
  jadwalPelaksanaan?: string;
}

export interface DokumenPeserta {
  id: string; // DOC-2026-00001
  jenisDokumen: string; // e.g. 'Foto', 'Kartu Pelajar', 'KK', 'Akta Kelahiran', 'Surat Sehat'
  namaFile: string;
  fileUrl: string;
  status: 'VALID' | 'MENUNGGU' | 'TIDAK VALID';
  catatan?: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface Peserta {
  id: string; // PS-2026-00001
  nomorPeserta: string; // Official unique registration number
  lembagaId: string;
  nis: string;
  nisn: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  kelas: string;
  tingkat: JenjangLembaga;
  cabangId: string;
  kategoriLomba: KategoriLomba;
  pembimbingId?: string;
  pembimbingNama?: string;
  pembimbingHp?: string;
  nomorHp?: string;
  email?: string;
  alamat?: string;
  fotoUrl?: string;
  status: PesertaStatus;
  catatanVerifikasi?: string;
  dokumenList: DokumenPeserta[];
  isLocked: boolean; // Data lock after final verification
  periodeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pembimbing {
  id: string;
  lembagaId: string;
  nama: string;
  noHp: string;
  email: string;
  jabatan: string;
  cabangId?: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  kategori: 'PENTING' | 'UMUM' | 'JADWAL' | 'HASIL';
  lampiranNama?: string;
  lampiranUrl?: string;
  status: 'PUBLISHED' | 'DRAFT';
  isNew: boolean;
  target: 'SEMUA' | 'LEMBAGA';
}

export interface JadwalKegiatan {
  id: string;
  kegiatan: string;
  mulai: string;
  selesai: string;
  keterangan: string;
  status: 'SELESAI' | 'BERLANGSUNG' | 'AKAN DATANG';
  tahap: number;
}

export interface FotoKegiatan {
  id: string;
  judul: string;
  deskripsi?: string;
  kategori: 'PEMBUKAAN' | 'OLAHRAGA' | 'SENI' | 'JUARA' | 'DOKUMENTASI';
  tanggal: string;
  imageUrl: string;
  periodeId: string;
}

export interface PengaturanSistem {
  namaWebsite: string; // e.g. "PORSENI DIGITAL" or configurable name
  namaPorseni: string;
  tahun: string;
  tema: string;
  namaPenyelenggara: string;
  tingkatWilayah: string; // e.g. "Tingkat Nasional", "Tingkat Provinsi", "Tingkat Kabupaten/Kota", "Tingkat Yayasan/Perguruan"
  alamat: string;
  email: string;
  telepon: string;
  website: string;
  mediaSosial: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  statusPendaftaran: boolean; // open or closed
  batasPendaftaran: string;
  statusMaintenance: boolean;
  aktifPeriodeId: string;
  ketentuanUmum: string;
  tujuanKegiatan: string;
}

export interface Periode {
  id: string;
  tahun: string;
  nama: string;
  tema: string;
  status: 'AKTIF' | 'NONAKTIF' | 'ARSIP';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole | 'SISTEM' | 'PUBLIK';
  aktivitas: string;
  rincian: string;
  ip: string;
  status: 'SUKSES' | 'GAGAL' | 'PERINGATAN';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}
