import React, { useState, useEffect } from 'react';
import { FotoKegiatan, PengaturanSistem } from '../../types';
import { StorageService } from '../../services/storage';
import { PorseniEmblem } from '../common/OfficialLogos';
import {
  Image as ImageIcon,
  ArrowLeft,
  Search,
  Eye,
  X,
  Calendar,
  Sparkles,
  Video,
  ChevronDown,
} from 'lucide-react';

interface GaleriFotoProps {
  onBackToHome: () => void;
  onNavigateVideo: () => void;
  onOpenLogin: (role: 'ADMIN' | 'LEMBAGA') => void;
}

export const GaleriFoto: React.FC<GaleriFotoProps> = ({
  onBackToHome,
  onNavigateVideo,
  onOpenLogin,
}) => {
  const [settings] = useState<PengaturanSistem>(StorageService.getPengaturan());
  const [fotoList, setFotoList] = useState<FotoKegiatan[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<FotoKegiatan | null>(null);
  const [displayCount, setDisplayCount] = useState(12);

  const loadData = () => {
    const list = StorageService.getFotoKegiatan();
    // Sort newest first
    const sorted = [...list].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
    setFotoList(sorted);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('porseni_foto_updated', handleUpdate);
    return () => {
      window.removeEventListener('porseni_foto_updated', handleUpdate);
    };
  }, []);

  const kategoriOptions = [
    { id: 'SEMUA', label: 'Semua Kategori' },
    { id: 'PEMBUKAAN', label: 'Pembukaan' },
    { id: 'OLAHRAGA', label: 'Olahraga' },
    { id: 'SENI', label: 'Seni Budaya' },
    { id: 'JUARA', label: 'Penganugerahan Juara' },
    { id: 'DOKUMENTASI', label: 'Dokumentasi' },
  ];

  const filtered = fotoList.filter(f => {
    const matchCat = selectedKategori === 'SEMUA' || f.kategori === selectedKategori;
    const matchQuery =
      f.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.deskripsi && f.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  const visibleList = filtered.slice(0, displayCount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="bg-emerald-950 text-emerald-200 px-4 py-1 text-[11px] border-b border-emerald-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="truncate">
              Galeri Dokumentasi Resmi {settings.namaPorseni} {settings.tahun}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToHome}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <PorseniEmblem size={40} className="shrink-0" />
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-emerald-950 leading-tight">
                {settings.namaWebsite || 'PORSENI DIGITAL'}
              </h1>
              <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                Galeri Foto Dokumentasi Kegiatan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateVideo}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buka Galeri Video</span>
            </button>
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-emerald-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Beranda</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO / PAGE BANNER */}
      <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-10 px-4 border-b-4 border-amber-400 shadow-md">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-300 text-xs font-bold">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Dokumentasi Visual Resmi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Galeri Foto Kegiatan PORSENI
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Arsip lengkap rekaman lensa dari kemeriahan pembukaan, perjuangan atlet di lapangan, keindahan pentas seni budaya, hingga senyum kebanggaan di podium juara.
          </p>
        </div>
      </section>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <section className="bg-white border-b border-slate-200 sticky top-[95px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            {kategoriOptions.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedKategori(cat.id);
                  setDisplayCount(12);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                  selectedKategori === cat.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box & Stats */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari judul atau keterangan foto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              {filtered.length} Foto
            </span>
          </div>
        </div>
      </section>

      {/* 4. MAIN PHOTO GRID */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Tidak ada foto yang ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada dokumentasi foto yang cocok dengan kata kunci "${searchQuery}".`
                : 'Belum ada foto yang diunggah untuk kategori ini.'}
            </p>
            {(searchQuery || selectedKategori !== 'SEMUA') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedKategori('SEMUA');
                }}
                className="mt-2 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-300"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleList.map(foto => {
                const badgeColor = {
                  PEMBUKAAN: 'bg-emerald-600 text-white',
                  OLAHRAGA: 'bg-blue-600 text-white',
                  SENI: 'bg-purple-600 text-white',
                  JUARA: 'bg-amber-500 text-slate-950 font-black',
                  DOKUMENTASI: 'bg-slate-700 text-white',
                }[foto.kategori] || 'bg-emerald-700 text-white';

                return (
                  <div
                    key={foto.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(foto)}>
                      <img
                        src={foto.imageUrl}
                        alt={foto.judul}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${badgeColor}`}>
                          {foto.kategori}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Lihat Ukuran Penuh</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{foto.tanggal}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                          {foto.judul}
                        </h3>
                        {foto.deskripsi && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {foto.deskripsi}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => setPreviewPhoto(foto)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Pratinjau</span>
                        </button>
                        <span className="text-slate-400 text-[10px] font-mono">
                          {settings.tahun}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button if remaining */}
            {visibleList.length < filtered.length && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setDisplayCount(prev => prev + 12)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 font-bold text-xs rounded-xl border-2 border-emerald-300 shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2"
                >
                  <span>Muat Lebih Banyak ({filtered.length - visibleList.length} Foto Tersisa)</span>
                  <ChevronDown className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-emerald-950 text-white py-8 px-4 border-t-4 border-amber-400 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-300 text-[11px]">
          <p>© {settings.tahun} {settings.namaPorseni}. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-3">
            <button onClick={onBackToHome} className="hover:text-amber-300 transition-colors">
              Beranda
            </button>
            <span>·</span>
            <button onClick={onNavigateVideo} className="hover:text-amber-300 transition-colors">
              Galeri Video
            </button>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX / FULL PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="relative bg-black flex items-center justify-center overflow-hidden flex-1 min-h-[300px]">
              <img
                src={previewPhoto.imageUrl}
                alt={previewPhoto.judul}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-full object-contain"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                    {previewPhoto.kategori}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{previewPhoto.tanggal}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  PORSENI {settings.tahun}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {previewPhoto.judul}
              </h3>
              {previewPhoto.deskripsi && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {previewPhoto.deskripsi}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
