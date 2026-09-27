import {
  AuditLog,
  CabangLomba,
  FotoKegiatan,
  JadwalKegiatan,
  Lembaga,
  PengaturanSistem,
  Pengumuman,
  Periode,
  Peserta,
  User,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'porseni_users_v1',
  LEMBAGA: 'porseni_lembaga_v1',
  CABANG: 'porseni_cabang_v1',
  PESERTA: 'porseni_peserta_v1',
  PENGUMUMAN: 'porseni_pengumuman_v1',
  JADWAL: 'porseni_jadwal_v1',
  FOTO_KEGIATAN: 'porseni_foto_kegiatan_v1',
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

const defaultFotoKegiatan: FotoKegiatan[] = [
  {
    id: 'FTO-001',
    judul: 'Upacara Pembukaan & Kirab Obor PORSENI',
    deskripsi: 'Pelepasan kontingen atlet dan seniman dengan defile barisan perwakilan lembaga.',
    kategori: 'PEMBUKAAN',
    tanggal: '2026-09-25',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
  {
    id: 'FTO-002',
    judul: 'Pertandingan Final Futsal Pelajar',
    deskripsi: 'Suasana laga perebutan medali emas futsal beregu putra yang berlangsung sengit dan sportif.',
    kategori: 'OLAHRAGA',
    tanggal: '2026-09-27',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
  {
    id: 'FTO-003',
    judul: 'Lomba Musabaqah Tilawatil Qur\'an (MTQ)',
    deskripsi: 'Lantunan ayat suci Al-Qur\'an cabang tilawah di panggung utama auditorium kesenian.',
    kategori: 'SENI',
    tanggal: '2026-09-26',
    imageUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
  {
    id: 'FTO-004',
    judul: 'Pertandingan Bulutangkis Tunggal Putra',
    deskripsi: 'Aksi reli panjang atlet bulutangkis antar perwakilan kontingen di Hall Olahraga.',
    kategori: 'OLAHRAGA',
    tanggal: '2026-09-26',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
  {
    id: 'FTO-005',
    judul: 'Pameran & Penilaian Seni Kaligrafi Kontemporer',
    deskripsi: 'Goresan indah karya peserta lomba kaligrafi Islam kontemporer yang dipamerkan di galeri seni.',
    kategori: 'SENI',
    tanggal: '2026-09-27',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
  {
    id: 'FTO-006',
    judul: 'Penganugerahan Medali & Piala Juara Umum',
    deskripsi: 'Penyerahan medali emas, perak, perunggu dan piala bergilir kepada kontingen berprestasi.',
    kategori: 'JUARA',
    tanggal: '2026-09-30',
    imageUrl: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&auto=format&fit=crop&q=80',
    periodeId: 'PRD-2026',
  },
];

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

const defaultLembaga: Lembaga[] = [
  {
    id: 'LG-2026-00001',
    kodeLembaga: 'MAN1-MLG',
    nama: 'MAN 1 Kota Malang',
    npsn: '20580045',
    nsm: '131135730001',
    jenjang: 'MA/SMA/SMK',
    status: 'AKTIF',
    alamat: 'Jl. Baiduri Sepah No. 27, Tlogomas',
    desaKelurahan: 'Tlogomas',
    kecamatan: 'Lowokwaru',
    kabupatenKota: 'Kota Malang',
    provinsi: 'Jawa Timur',
    kodePos: '65144',
    pimpinanNama: 'Dr. H. Ahmad Fauzi, M.Pd.',
    pimpinanNip: '197305141998031002',
    pimpinanHp: '081233445566',
    pimpinanEmail: 'kepala@man1malang.sch.id',
    operatorNama: 'Budi Santoso, S.Kom.',
    operatorNik: '3573011405900002',
    operatorHp: '081333444555',
    operatorEmail: 'operator@man1malang.sch.id',
    username: 'operator.man1',
    passwordHash: 'dummy_hash', // will be initialized with real hash
    suratMandatNama: 'SK_Mandat_MAN1_Malang.pdf',
    suratMandatUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
    identitasLembagaNama: 'Izin_Operasional_Kemenag.pdf',
    catatanVerifikasi: 'Berkas lengkap dan terverifikasi sah oleh Panitia Pusat.',
    periodeId: 'PRD-2026',
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-10T14:30:00Z',
  },
  {
    id: 'LG-2026-00002',
    kodeLembaga: 'SMAN3-SBY',
    nama: 'SMA Negeri 3 Surabaya',
    npsn: '20532189',
    jenjang: 'MA/SMA/SMK',
    status: 'AKTIF',
    alamat: 'Jl. Memet Sastrawirya No. 9',
    desaKelurahan: 'Sawunggaling',
    kecamatan: 'Wonokromo',
    kabupatenKota: 'Kota Surabaya',
    provinsi: 'Jawa Timur',
    kodePos: '60242',
    pimpinanNama: 'Dra. Hj. Sri Wahyuni, M.Si.',
    pimpinanHp: '081298765432',
    pimpinanEmail: 'kepala@sman3surabaya.sch.id',
    operatorNama: 'Reza Pratama, S.Pd.',
    operatorNik: '3578051206920001',
    operatorHp: '081555666777',
    operatorEmail: 'operator@sman3surabaya.sch.id',
    username: 'operator.sman3',
    passwordHash: 'dummy_hash',
    suratMandatNama: 'Surat_Tugas_Kontingen_SMAN3.pdf',
    catatanVerifikasi: 'Terverifikasi.',
    periodeId: 'PRD-2026',
    createdAt: '2026-08-08T10:15:00Z',
    updatedAt: '2026-08-12T11:00:00Z',
  },
  {
    id: 'LG-2026-00003',
    kodeLembaga: 'MTSN2-BDG',
    nama: 'MTs Negeri 2 Kota Bandung',
    npsn: '20277812',
    nsm: '121132730002',
    jenjang: 'MTs/SMP',
    status: 'MENUNGGU VERIFIKASI',
    alamat: 'Jl. Cijerah No. 89',
    desaKelurahan: 'Cijerah',
    kecamatan: 'Bandung Kulon',
    kabupatenKota: 'Kota Bandung',
    provinsi: 'Jawa Barat',
    kodePos: '40213',
    pimpinanNama: 'H. Dadan Hamdani, M.Ag.',
    pimpinanHp: '081322334455',
    pimpinanEmail: 'kepala@mtsn2bandung.sch.id',
    operatorNama: 'Asep Supriatna',
    operatorNik: '3273081007880003',
    operatorHp: '081809001122',
    operatorEmail: 'operator@mtsn2bandung.sch.id',
    username: 'operator.mtsn2',
    passwordHash: 'dummy_hash',
    suratMandatNama: 'Mandat_Porseni_MTsN2.pdf',
    catatanVerifikasi: 'Menunggu review dokumen SK Mandat oleh panitia pendaftaran.',
    periodeId: 'PRD-2026',
    createdAt: '2026-08-25T13:40:00Z',
    updatedAt: '2026-08-25T13:40:00Z',
  },
];

const defaultPeserta: Peserta[] = [
  {
    id: 'PS-2026-00001',
    nomorPeserta: 'PORSENI-2026-00101',
    lembagaId: 'LG-2026-00001',
    nis: '18492',
    nisn: '0068192841',
    nik: '3573021508070001',
    nama: 'Muhammad Rizky Pratama',
    tempatLahir: 'Malang',
    tanggalLahir: '2008-05-15',
    jenisKelamin: 'L',
    kelas: 'XI MIPA 2',
    tingkat: 'MA/SMA/SMK',
    cabangId: 'CB-001', // Futsal
    kategoriLomba: 'OLAHRAGA',
    pembimbingNama: 'Hendra Setiawan, S.Pd. (Pelatih Futsal)',
    pembimbingHp: '081234567891',
    nomorHp: '085712345678',
    email: 'rizky.pratama@student.man1.sch.id',
    alamat: 'Jl. Cengger Ayam No. 12, Malang',
    status: 'TERVERIFIKASI',
    catatanVerifikasi: 'Data identitas dan dokumen lengkap dan valid.',
    dokumenList: [
      {
        id: 'DOC-2026-00001',
        jenisDokumen: 'Foto Resmi 3x4',
        namaFile: 'Pasfoto_Rizky_Pratama.jpg',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-22T10:00:00Z',
        verifiedAt: '2026-08-24T11:00:00Z',
      },
      {
        id: 'DOC-2026-00002',
        jenisDokumen: 'Kartu Pelajar',
        namaFile: 'KartuPelajar_Rizky.pdf',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-22T10:02:00Z',
        verifiedAt: '2026-08-24T11:00:00Z',
      },
      {
        id: 'DOC-2026-00003',
        jenisDokumen: 'Akta Kelahiran / KK',
        namaFile: 'AktaKelahiran_Rizky.pdf',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-22T10:05:00Z',
        verifiedAt: '2026-08-24T11:00:00Z',
      },
      {
        id: 'DOC-2026-00004',
        jenisDokumen: 'Surat Keterangan Dokter',
        namaFile: 'SuratSehat_Puskesmas.pdf',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-22T10:08:00Z',
        verifiedAt: '2026-08-24T11:00:00Z',
      },
    ],
    isLocked: true,
    periodeId: 'PRD-2026',
    createdAt: '2026-08-22T09:45:00Z',
    updatedAt: '2026-08-24T11:00:00Z',
  },
  {
    id: 'PS-2026-00002',
    nomorPeserta: 'PORSENI-2026-00102',
    lembagaId: 'LG-2026-00001',
    nis: '18510',
    nisn: '0071294812',
    nik: '3573032009080004',
    nama: 'Fatimah Az-Zahra',
    tempatLahir: 'Malang',
    tanggalLahir: '2008-09-20',
    jenisKelamin: 'P',
    kelas: 'XI Keagamaan 1',
    tingkat: 'MA/SMA/SMK',
    cabangId: 'CB-006', // MTQ Putri
    kategoriLomba: 'SENI',
    pembimbingNama: 'Ust. Nurul Huda, M.Pd.',
    pembimbingHp: '081399887766',
    nomorHp: '085811223344',
    email: 'fatimah.azzahra@student.man1.sch.id',
    alamat: 'Jl. Dinoyo Permai Blok B-4, Malang',
    status: 'TERVERIFIKASI',
    catatanVerifikasi: 'Lolos verifikasi tilawah dan umur.',
    dokumenList: [
      {
        id: 'DOC-2026-00005',
        jenisDokumen: 'Foto Resmi 3x4',
        namaFile: 'Pasfoto_Fatimah.jpg',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-23T14:10:00Z',
        verifiedAt: '2026-08-25T09:30:00Z',
      },
      {
        id: 'DOC-2026-00006',
        jenisDokumen: 'Kartu Pelajar',
        namaFile: 'KartuPelajar_Fatimah.pdf',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-23T14:15:00Z',
        verifiedAt: '2026-08-25T09:30:00Z',
      },
    ],
    isLocked: true,
    periodeId: 'PRD-2026',
    createdAt: '2026-08-23T14:00:00Z',
    updatedAt: '2026-08-25T09:30:00Z',
  },
  {
    id: 'PS-2026-00003',
    nomorPeserta: 'PORSENI-2026-00103',
    lembagaId: 'LG-2026-00001',
    nis: '18555',
    nisn: '0069382103',
    nik: '3573010411070005',
    nama: 'Achmad Dani Ramadhan',
    tempatLahir: 'Batu',
    tanggalLahir: '2007-11-04',
    jenisKelamin: 'L',
    kelas: 'XII IPS 1',
    tingkat: 'MA/SMA/SMK',
    cabangId: 'CB-003', // Bulutangkis Tunggal Putra
    kategoriLomba: 'OLAHRAGA',
    pembimbingNama: 'Bambang Irawan, S.Pd.',
    pembimbingHp: '081244556677',
    nomorHp: '082133445566',
    alamat: 'Jl. Oro-Oro Ombo No. 88, Kota Batu',
    status: 'MENUNGGU VERIFIKASI',
    dokumenList: [
      {
        id: 'DOC-2026-00007',
        jenisDokumen: 'Foto Resmi 3x4',
        namaFile: 'Pasfoto_Dani.jpg',
        fileUrl: '',
        status: 'MENUNGGU',
        uploadedAt: '2026-09-02T11:20:00Z',
      },
      {
        id: 'DOC-2026-00008',
        jenisDokumen: 'Kartu Pelajar',
        namaFile: 'KTS_Dani_Ramadhan.pdf',
        fileUrl: '',
        status: 'MENUNGGU',
        uploadedAt: '2026-09-02T11:22:00Z',
      },
    ],
    isLocked: false,
    periodeId: 'PRD-2026',
    createdAt: '2026-09-02T11:15:00Z',
    updatedAt: '2026-09-02T11:22:00Z',
  },
  {
    id: 'PS-2026-00004',
    nomorPeserta: 'PORSENI-2026-00201',
    lembagaId: 'LG-2026-00002',
    nis: '21094',
    nisn: '0075543210',
    nik: '3578051210080003',
    nama: 'Syifa Aurelia Maharani',
    tempatLahir: 'Surabaya',
    tanggalLahir: '2008-10-12',
    jenisKelamin: 'P',
    kelas: 'XI IPA 4',
    tingkat: 'MA/SMA/SMK',
    cabangId: 'CB-007', // Kaligrafi
    kategoriLomba: 'SENI',
    pembimbingNama: 'Dra. Erna Widiyawati',
    pembimbingHp: '081333777888',
    status: 'PERLU PERBAIKAN',
    catatanVerifikasi: 'Foto kartu pelajar buram dan tidak terbaca. Harap unggah ulang scan yang jelas.',
    dokumenList: [
      {
        id: 'DOC-2026-00009',
        jenisDokumen: 'Foto Resmi 3x4',
        namaFile: 'Syifa_Foto.jpg',
        fileUrl: '',
        status: 'VALID',
        uploadedAt: '2026-08-30T10:00:00Z',
      },
      {
        id: 'DOC-2026-00010',
        jenisDokumen: 'Kartu Pelajar',
        namaFile: 'Kartu_Pelajar_Buram.jpg',
        fileUrl: '',
        status: 'TIDAK VALID',
        catatan: 'Foto buram dan tanggal lahir terpotong.',
        uploadedAt: '2026-08-30T10:05:00Z',
      },
    ],
    isLocked: false,
    periodeId: 'PRD-2026',
    createdAt: '2026-08-30T09:50:00Z',
    updatedAt: '2026-09-01T15:00:00Z',
  },
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'LOG-00001',
    timestamp: '2026-08-01T08:00:00Z',
    user: 'SYSTEM',
    role: 'SISTEM',
    aktivitas: 'Inisialisasi Sistem PORSENI Digital',
    rincian: 'Sistem informasi PORSENI Nasional 2026 aktif.',
    ip: '127.0.0.1',
    status: 'SUKSES',
  },
  {
    id: 'LOG-00002',
    timestamp: '2026-08-10T14:30:00Z',
    user: 'admin',
    role: 'ADMIN',
    aktivitas: 'Verifikasi Lembaga',
    rincian: 'Menyetujui pendaftaran lembaga MAN 1 Kota Malang (LG-2026-00001).',
    ip: '180.252.112.44',
    status: 'SUKSES',
  },
  {
    id: 'LOG-00003',
    timestamp: '2026-08-24T11:00:00Z',
    user: 'admin',
    role: 'ADMIN',
    aktivitas: 'Verifikasi Peserta',
    rincian: 'Mengesahkan peserta Muhammad Rizky Pratama (PS-2026-00001) cabang Futsal.',
    ip: '180.252.112.44',
    status: 'SUKSES',
  },
  {
    id: 'LOG-00004',
    timestamp: '2026-09-02T11:15:00Z',
    user: 'operator.man1',
    role: 'LEMBAGA',
    aktivitas: 'Pendaftaran Peserta Baru',
    rincian: 'Menambahkan peserta Achmad Dani Ramadhan (PS-2026-00003).',
    ip: '114.125.77.20',
    status: 'SUKSES',
  },
];

// Database Repository Class
export class StorageService {
  private static isInitialized = false;

  public static async init() {
    if (this.isInitialized) return;

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
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultAuditLogs));
    }

    // Initialize Default Users with secure hashes
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const adminHash = await hashPassword('admin123');
      const lembagaDefaultHash = await hashPassword('123456');

      const defaultUsers: User[] = [
        {
          id: 'USR-ADMIN-01',
          username: 'admin',
          email: 'admin@porseni.go.id',
          passwordHash: adminHash,
          role: 'ADMIN',
          namaLengkap: 'Administrator Panitia Pelaksana PORSENI',
          createdAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 'USR-OP-01',
          username: 'operator@man1malang.sch.id',
          email: 'operator@man1malang.sch.id',
          passwordHash: lembagaDefaultHash,
          role: 'LEMBAGA',
          lembagaId: 'LG-2026-00001',
          namaLengkap: 'Operator MAN 1 Kota Malang',
          createdAt: '2026-08-05T09:00:00Z',
        },
        {
          id: 'USR-OP-02',
          username: 'operator@sman3surabaya.sch.id',
          email: 'operator@sman3surabaya.sch.id',
          passwordHash: lembagaDefaultHash,
          role: 'LEMBAGA',
          lembagaId: 'LG-2026-00002',
          namaLengkap: 'Operator SMA Negeri 3 Surabaya',
          createdAt: '2026-08-08T10:15:00Z',
        },
        {
          id: 'USR-OP-03',
          username: 'operator@mtsn2bandung.sch.id',
          email: 'operator@mtsn2bandung.sch.id',
          passwordHash: lembagaDefaultHash,
          role: 'LEMBAGA',
          lembagaId: 'LG-2026-00003',
          namaLengkap: 'Operator MTs Negeri 2 Bandung',
          createdAt: '2026-08-25T13:40:00Z',
        },
      ];

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));

      // Link hash to default lembaga
      const updatedLembaga = defaultLembaga.map(l => {
        return { ...l, passwordHash: lembagaDefaultHash, username: l.operatorEmail };
      });
      localStorage.setItem(STORAGE_KEYS.LEMBAGA, JSON.stringify(updatedLembaga));
    }

    if (!localStorage.getItem(STORAGE_KEYS.PESERTA)) {
      localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(defaultPeserta));
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

  private static setItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
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
    if (index >= 0) {
      list[index] = { ...lembaga, updatedAt: new Date().toISOString() };
    } else {
      list.push(lembaga);
    }
    this.setItems(STORAGE_KEYS.LEMBAGA, list);
  }

  public static deleteLembaga(id: string): void {
    const list = this.getLembaga().filter(l => l.id !== id);
    this.setItems(STORAGE_KEYS.LEMBAGA, list);
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
  }

  public static deleteCabang(id: string): void {
    const list = this.getCabang().filter(c => c.id !== id);
    this.setItems(STORAGE_KEYS.CABANG, list);
  }

  // --- PESERTA ---
  public static getPeserta(): Peserta[] {
    return this.getItems<Peserta>(STORAGE_KEYS.PESERTA);
  }

  public static getPesertaById(id: string): Peserta | undefined {
    return this.getPeserta().find(p => p.id === id || p.nomorPeserta === id);
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
    if (index >= 0) {
      list[index] = { ...peserta, updatedAt: new Date().toISOString() };
    } else {
      list.push(peserta);
    }
    this.setItems(STORAGE_KEYS.PESERTA, list);
  }

  public static deletePeserta(id: string): void {
    const list = this.getPeserta().filter(p => p.id !== id);
    this.setItems(STORAGE_KEYS.PESERTA, list);
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
  }

  public static deletePengumuman(id: string): void {
    const list = this.getPengumuman().filter(p => p.id !== id);
    this.setItems(STORAGE_KEYS.PENGUMUMAN, list);
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
  }

  public static deleteJadwal(id: string): void {
    const list = this.getJadwal().filter(j => j.id !== id);
    this.setItems(STORAGE_KEYS.JADWAL, list);
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
  }

  public static deleteFotoKegiatan(id: string): void {
    const list = this.getFotoKegiatan().filter(f => f.id !== id);
    this.setItems(STORAGE_KEYS.FOTO_KEGIATAN, list);
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

  public static savePengaturan(settings: PengaturanSistem): void {
    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(settings));
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

      return { success: true, message: 'Data cadangan sistem berhasil dipulihkan secara penuh!' };
    } catch (e: any) {
      return { success: false, message: 'Gagal memproses file: ' + (e.message || 'JSON tidak valid') };
    }
  }

  // Reset to factory defaults
  public static resetToFactoryDefaults(): void {
    localStorage.clear();
    this.isInitialized = false;
    this.init();
  }
}
