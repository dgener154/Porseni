import React, { useState } from 'react';
import { CabangLomba, FotoKegiatan, JadwalKegiatan, PengaturanSistem, Pengumuman } from '../../types';
import { StorageService } from '../../services/storage';
import { PorseniEmblem } from '../common/OfficialLogos';
import {
  Trophy,
  Calendar,
  Bell,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Search,
  Users,
  Award,
  Sparkles,
  FileCheck2,
  LogIn,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: (role: 'ADMIN' | 'LEMBAGA') => void;
  onOpenRegistrasi: () => void;
  onOpenValidasi: () => void;
}

// Category color palettes for vibrant cards
const BRANCH_PALETTES = [
  { border: 'border-emerald-500', headerBg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  { border: 'border-blue-500', headerBg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', bar: 'bg-blue-500' },
  { border: 'border-amber-500', headerBg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  { border: 'border-purple-500', headerBg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', bar: 'bg-purple-500' },
  { border: 'border-teal-500', headerBg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-800', bar: 'bg-teal-500' },
  { border: 'border-rose-500', headerBg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-800', bar: 'bg-rose-500' },
  { border: 'border-indigo-500', headerBg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800', bar: 'bg-indigo-500' },
  { border: 'border-cyan-500', headerBg: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-800', bar: 'bg-cyan-500' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenValidasi,
}) => {
  const [settings] = useState<PengaturanSistem>(StorageService.getPengaturan());
  const [cabangList] = useState<CabangLomba[]>(StorageService.getCabang());
  const [jadwalList] = useState<JadwalKegiatan[]>(StorageService.getJadwal());
  const [pengumumanList] = useState<Pengumuman[]>(StorageService.getPengumuman());
  const [fotoList] = useState<FotoKegiatan[]>(StorageService.getFotoKegiatan());

  const [activeTabKategori, setActiveTabKategori] = useState<'SEMUA' | 'OLAHRAGA' | 'SENI'>('SEMUA');
  const [searchCabang, setSearchCabang] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<FotoKegiatan | null>(null);

  const filteredCabang = cabangList.filter(c => {
    const matchCat = activeTabKategori === 'SEMUA' || c.kategori === activeTabKategori;
    const matchSearch =
      c.nama.toLowerCase().includes(searchCabang.toLowerCase()) ||
      c.kode.toLowerCase().includes(searchCabang.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* 1. OFFICIAL TOP BAR & NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        {/* Top Official Micro Strip */}
        <div className="bg-emerald-950 text-emerald-200 px-4 py-1 text-[11px] border-b border-emerald-900">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="truncate">
              Portal Resmi Penyelenggaraan Kegiatan {settings.namaPorseni} {settings.tahun}
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={onOpenValidasi}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Cek Keaslian Kartu Peserta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PorseniEmblem size={42} className="shrink-0" />
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-emerald-950 leading-tight">
                {settings.namaWebsite || 'PORSENI DIGITAL'}
              </h1>
              <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                {settings.namaPorseni} {settings.tahun}
              </p>
            </div>
          </div>

          {/* Clean Navbar: ONLY navigation links, NO duplicate login text */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <a href="#beranda" className="hover:text-emerald-700 transition-colors">
              Beranda
            </a>
            <a href="#tentang" className="hover:text-emerald-700 transition-colors">
              Tentang
            </a>
            <a href="#cabang" className="hover:text-emerald-700 transition-colors">
              Cabang Lomba
            </a>
            <a href="#galeri" className="hover:text-emerald-700 transition-colors">
              Foto Kegiatan
            </a>
            <a href="#jadwal" className="hover:text-emerald-700 transition-colors">
              Jadwal
            </a>
            <a href="#pengumuman" className="hover:text-emerald-700 transition-colors">
              Pengumuman
            </a>
            <a href="#kontak" className="hover:text-emerald-700 transition-colors">
              Kontak
            </a>
          </nav>

          {/* Single Official Login Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogin('ADMIN')}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH ANIMATED MOVING RAINBOW GRADIENT */}
      <section
        id="beranda"
        className="relative rainbow-animated-hero text-white py-16 px-4 overflow-hidden border-b-4 border-amber-400 shadow-xl"
      >
        {/* Soft Vignette & Ambient Glow for high contrast & elegance */}
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none"></div>
        {/* Animated Rainbow Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 rainbow-border-bottom"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/35 backdrop-blur-md text-amber-300 text-xs font-black tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {settings.tingkatWilayah || 'Portal Resmi'} · Tahun {settings.tahun}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {settings.namaPorseni}
            </h2>

            <p className="text-sm sm:text-base font-bold text-amber-200 italic border-l-4 border-amber-300 pl-3.5 drop-shadow-sm">
              "{settings.tema}"
            </p>

            <p className="text-xs sm:text-sm text-white/95 max-w-2xl leading-relaxed drop-shadow-xs font-medium">
              Sistem informasi pengelolaan kegiatan Pekan Olahraga dan Seni, integrasi pendaftaran atlet, verifikasi berkas persyaratan, rekapitulasi nilai, serta pencetakan kartu tanda peserta resmi.
            </p>

            {/* Hero CTA: Validasi Kartu Peserta with High Contrast & Vibrancy */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onOpenValidasi}
                className="px-6 py-3 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-lg hover:shadow-2xl transition-all flex items-center gap-2 border border-amber-300 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Validasi Kartu Peserta</span>
              </button>
            </div>

            {/* Quick Stats Highlights with Frosted Glass Colorful Cards */}
            <div className="pt-6 grid grid-cols-3 gap-3 max-w-lg text-center sm:text-left">
              <div className="p-3.5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md shadow-md transition-all">
                <span className="block text-2xl font-black text-white font-mono drop-shadow-xs">
                  {cabangList.length}
                </span>
                <span className="text-[11px] text-white/90 font-semibold">Cabang Lomba</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md shadow-md transition-all">
                <span className="block text-2xl font-black text-emerald-200 font-mono drop-shadow-xs">
                  100%
                </span>
                <span className="text-[11px] text-white/90 font-semibold">Verifikasi Digital</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md shadow-md transition-all">
                <span className="block text-2xl font-black text-amber-300 font-mono drop-shadow-xs">
                  {settings.tahun}
                </span>
                <span className="text-[11px] text-white/90 font-semibold">Tahun Kegiatan</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Emblem Card with Glassmorphism */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative p-7 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/35 shadow-2xl text-center max-w-xs hover:border-white/50 transition-all">
              <PorseniEmblem size={135} className="mx-auto drop-shadow-lg mb-4" />
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider drop-shadow-sm leading-snug">
                {settings.namaPenyelenggara}
              </h3>
              <p className="text-[11px] text-white/90 font-medium mt-1">
                {settings.tingkatWilayah || 'Penyelenggara Kegiatan'}
              </p>
              <div className="mt-4 py-1.5 px-3 bg-black/40 backdrop-blur-md rounded-lg border border-white/25 text-[11px] text-amber-200 font-mono font-bold shadow-inner">
                Periode: {settings.tahun}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INFORMASI PORSENI (TENTANG) WITH ATTRACTIVE COLORED CARDS */}
      <section id="tentang" className="py-16 px-4 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Tentang Kegiatan
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {settings.namaPorseni} {settings.tahun}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Wadah kompetisi sehat dan pengukuhan integritas dalam unjuk keterampilan fisik, sportivitas, serta kehalusan estetika seni budaya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">Tujuan Kegiatan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings.tujuanKegiatan}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-amber-950">Sasaran Kontingen</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diikuti oleh siswa/siswi serta perwakilan atlet/seniman resmi dari setiap lembaga terdaftar yang telah memiliki rekomendasi pimpinan kontingen.
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-teal-50 to-white rounded-2xl border-2 border-teal-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-teal-950">Ketentuan Umum</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings.ketentuanUmum}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CABANG LOMBA (OLAHRAGA & SENI) WITH ATTRACTIVE COLOR CARDS */}
      <section id="cabang" className="py-16 px-4 bg-slate-100 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Daftar Kompetisi
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Cabang Lomba Olahraga & Seni
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih cabang untuk melihat kuota, jenis tanding, dan persyaratan berkas wajib.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setActiveTabKategori('SEMUA')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTabKategori === 'SEMUA'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({cabangList.length})
                </button>
                <button
                  onClick={() => setActiveTabKategori('OLAHRAGA')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTabKategori === 'OLAHRAGA'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Olahraga
                </button>
                <button
                  onClick={() => setActiveTabKategori('SENI')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTabKategori === 'SENI'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Seni Budaya
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari cabang lomba..."
                  value={searchCabang}
                  onChange={e => setSearchCabang(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Branch Grid with Colorful Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCabang.map((cabang, idx) => {
              const palette = BRANCH_PALETTES[idx % BRANCH_PALETTES.length];
              return (
                <div
                  key={cabang.id}
                  className={`bg-white rounded-2xl border-2 ${palette.border} p-4 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group`}
                >
                  {/* Top Color Accent Line */}
                  <div className={`h-1.5 w-full ${palette.bar} absolute top-0 left-0`}></div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] mb-2.5">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cabang.kode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${palette.badge}`}>
                        {cabang.kategori} · {cabang.gender}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-emerald-800 transition-colors">
                      {cabang.nama}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {cabang.persyaratan}
                    </p>
                  </div>

                  <div className={`p-2.5 rounded-xl ${palette.headerBg} border border-slate-100 text-[11px] space-y-1`}>
                    <div className="flex justify-between text-slate-700">
                      <span>Tingkat:</span>
                      <span className="font-bold">{cabang.tingkat}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Kuota Lembaga:</span>
                      <span className="font-bold text-emerald-800">
                        {cabang.jenis} (Maks. {cabang.kuotaMaks})
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-emerald-700 font-bold">Status: Aktif</span>
                      <span className="text-slate-500">{cabang.dokumenWajib.length} Berkas</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. GALERI FOTO KEGIATAN PORSENI (REQUESTED IN POINT 6) */}
      <section id="galeri" className="py-16 px-4 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Dokumentasi Resmi</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Galeri Foto & Momen Kegiatan PORSENI
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dokumentasi pembukaan, pertandingan olahraga, panggung kreasi seni, dan momen penganugerahan juara.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {fotoList.length} Foto Dokumentasi Terarsip
            </span>
          </div>

          {/* Photo Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fotoList.map((foto, index) => {
              const badgeColors = {
                PEMBUKAAN: 'bg-emerald-600 text-white',
                OLAHRAGA: 'bg-blue-600 text-white',
                SENI: 'bg-purple-600 text-white',
                JUARA: 'bg-amber-500 text-white',
                DOKUMENTASI: 'bg-slate-700 text-white',
              }[foto.kategori] || 'bg-emerald-700 text-white';

              return (
                <div
                  key={foto.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      src={foto.imageUrl}
                      alt={foto.judul}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${badgeColors}`}>
                        {foto.kategori}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewPhoto(foto)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lihat Ukuran Penuh</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{foto.tanggal}</span>
                      <span>PORSENI {settings.tahun}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {foto.judul}
                    </h3>

                    {foto.deskripsi && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {foto.deskripsi}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. JADWAL & TIMELINE KEGIATAN */}
      <section id="jadwal" className="py-16 px-4 bg-slate-100 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Agenda & Tahapan
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Jadwal Pelaksanaan PORSENI {settings.tahun}
            </h2>
            <p className="text-xs text-slate-500">
              Perhatikan tenggat waktu penting pendaftaran dan verifikasi kontingen.
            </p>
          </div>

          <div className="relative border-l-2 border-emerald-600 ml-4 sm:ml-8 space-y-6">
            {jadwalList.map((item, idx) => (
              <div key={item.id} className="relative pl-6 sm:pl-8">
                {/* Timeline Node Badge */}
                <div
                  className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                    item.status === 'SELESAI'
                      ? 'bg-emerald-600 text-white'
                      : item.status === 'BERLANGSUNG'
                      ? 'bg-amber-400 text-emerald-950 ring-4 ring-amber-100 animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.status === 'SELESAI' ? '✓' : idx + 1}
                </div>

                <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{item.kegiatan}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded font-mono">
                        {item.mulai} s.d {item.selesai}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'BERLANGSUNG'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'SELESAI'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{item.keterangan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PENGUMUMAN TERBARU */}
      <section id="pengumuman" className="py-16 px-4 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Papan Informasi
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Pengumuman & Surat Edaran Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Informasi terkini dari Panitia Pelaksana PORSENI {settings.tahun}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pengumumanList.map(ann => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border-2 border-emerald-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-emerald-700">{ann.kategori}</span>
                    <span className="font-mono text-[11px]">{ann.tanggal}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 flex items-start gap-1.5">
                    {ann.isNew && (
                      <span className="px-1.5 py-0.2 bg-rose-600 text-white font-extrabold text-[9px] rounded uppercase shrink-0">
                        BARU
                      </span>
                    )}
                    <span>{ann.judul}</span>
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {ann.isi}
                  </p>
                </div>

                {ann.lampiranNama && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{ann.lampiranNama}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FOOTER (Universal, Neutral Branding) */}
      <footer id="kontak" className="bg-emerald-950 text-white pt-12 pb-8 px-4 border-t-4 border-amber-400">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-emerald-900 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PorseniEmblem size={44} />
              <div>
                <h4 className="font-extrabold text-sm text-amber-300">{settings.namaWebsite || 'PORSENI DIGITAL'}</h4>
                <p className="text-[10px] text-emerald-200">Sistem Informasi Olahraga & Seni</p>
              </div>
            </div>
            <p className="text-emerald-200/80 leading-relaxed text-[11px]">
              Platform digital terintegrasi pendataan, verifikasi, dan manajemen kontingen PORSENI {settings.tahun}.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              Sekretariat Panitia
            </h5>
            <p className="text-emerald-200/80 flex items-start gap-2 text-[11px] leading-relaxed">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{settings.alamat}</span>
            </p>
            <p className="text-emerald-200/80 flex items-center gap-2 text-[11px]">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.telepon}</span>
            </p>
            <p className="text-emerald-200/80 flex items-center gap-2 text-[11px]">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.email}</span>
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              Akses Cepat
            </h5>
            <ul className="space-y-1.5 text-emerald-200 text-[11px]">
              <li>
                <button onClick={() => onOpenLogin('ADMIN')} className="hover:text-amber-300">
                  Login Sistem
                </button>
              </li>
              <li>
                <button onClick={onOpenValidasi} className="hover:text-amber-300">
                  Validasi Kartu Peserta
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
              Integritas & Sertifikasi
            </h5>
            <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800 text-[11px] text-emerald-200 leading-relaxed">
              Seluruh data peserta diverifikasi dan divalidasi dengan segel QR Code dinamis yang dapat diverifikasi keasliannya kapan saja.
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-300 gap-2">
          <p>© {settings.tahun} {settings.namaPorseni}. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <span>{settings.namaPenyelenggara}</span>
            <span>·</span>
            <span>{settings.tingkatWilayah || 'Portal Resmi'}</span>
          </div>
        </div>
      </footer>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={previewPhoto.imageUrl}
                alt={previewPhoto.judul}
                className="max-h-[70vh] w-full object-contain"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {previewPhoto.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{previewPhoto.tanggal}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{previewPhoto.judul}</h3>
              {previewPhoto.deskripsi && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{previewPhoto.deskripsi}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
