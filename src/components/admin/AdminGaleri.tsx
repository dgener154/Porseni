import React, { useState, useEffect, useRef } from 'react';
import { FotoKegiatan, VideoKegiatan } from '../../types';
import { StorageService } from '../../services/storage';
import { parseVideoUrl, getVideoThumbnail } from '../../utils/videoHelper';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Upload,
  Calendar,
  Clock,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  Sparkles,
} from 'lucide-react';

interface AdminGaleriProps {
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminGaleri: React.FC<AdminGaleriProps> = ({ onRefresh, onShowToast }) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'SEMUA' | 'FOTO' | 'VIDEO'>('SEMUA');
  const [filterKategori, setFilterKategori] = useState<string>('SEMUA');
  const [search, setSearch] = useState('');

  // Data collections
  const [fotoList, setFotoList] = useState<FotoKegiatan[]>([]);
  const [videoList, setVideoList] = useState<VideoKegiatan[]>([]);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'FOTO' | 'VIDEO'>('FOTO');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  // Editing state
  const [editingItem, setEditingItem] = useState<{
    type: 'FOTO' | 'VIDEO';
    id: string;
    judul: string;
    deskripsi: string;
    kategori: any;
    tanggal: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    durasi?: string;
  } | null>(null);

  // Preview state
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'FOTO' | 'VIDEO';
    item: FotoKegiatan | VideoKegiatan;
  } | null>(null);

  // Form State for Upload
  const [uploadForm, setUploadForm] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'PEMBUKAAN' as any,
    tanggal: new Date().toISOString().slice(0, 10),
    mediaUrl: '',
    thumbnailUrl: '',
    durasi: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = () => {
    setFotoList(StorageService.getFotoKegiatan());
    setVideoList(StorageService.getVideoKegiatan());
  };

  useEffect(() => {
    loadData();
    const handleFotoUpdate = () => loadData();
    const handleVideoUpdate = () => loadData();
    window.addEventListener('porseni_foto_updated', handleFotoUpdate);
    window.addEventListener('porseni_video_updated', handleVideoUpdate);
    return () => {
      window.removeEventListener('porseni_foto_updated', handleFotoUpdate);
      window.removeEventListener('porseni_video_updated', handleVideoUpdate);
    };
  }, []);

  // Handle Photo File Select with validation
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Format file tidak didukung. Gunakan file gambar JPG, PNG, atau WebP.');
      onShowToast('error', 'Format file tidak didukung.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas maksimal 5 MB.');
      onShowToast('error', 'Ukuran foto maksimal 5 MB.');
      return;
    }

    // Read and simulate progress
    setUploadProgress(10);
    const reader = new FileReader();

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 85) {
          clearInterval(progressTimer);
          return prev;
        }
        return prev + 25;
      });
    }, 100);

    reader.onload = evt => {
      clearInterval(progressTimer);
      setUploadProgress(100);
      setTimeout(() => {
        if (evt.target?.result) {
          setUploadForm(prev => ({ ...prev, mediaUrl: evt.target!.result as string }));
          setUploadProgress(null);
        }
      }, 250);
    };

    reader.onerror = () => {
      clearInterval(progressTimer);
      setUploadProgress(null);
      setUploadError('Gagal membaca berkas gambar. Silakan coba kembali.');
    };

    reader.readAsDataURL(file);
  };

  // Handle Video File / Link
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!uploadForm.judul.trim()) {
      setUploadError('Judul media wajib diisi.');
      return;
    }

    if (!uploadForm.mediaUrl.trim()) {
      setUploadError(
        uploadType === 'FOTO'
          ? 'Silakan unggah berkas foto atau masukkan tautan URL gambar.'
          : 'Silakan masukkan tautan URL video kegiatan.'
      );
      return;
    }

    if (uploadType === 'FOTO') {
      const newId = `FTO-${Date.now()}`;
      const newFoto: FotoKegiatan = {
        id: newId,
        judul: uploadForm.judul.trim(),
        deskripsi: uploadForm.deskripsi.trim(),
        kategori: uploadForm.kategori,
        tanggal: uploadForm.tanggal,
        imageUrl: uploadForm.mediaUrl.trim(),
        periodeId: 'PRD-2026',
      };
      StorageService.saveFotoKegiatan(newFoto);
      onShowToast('success', 'Foto kegiatan berhasil diunggah ke galeri PORSENI!');
    } else {
      const newId = `VID-${Date.now()}`;
      const newVideo: VideoKegiatan = {
        id: newId,
        judul: uploadForm.judul.trim(),
        deskripsi: uploadForm.deskripsi.trim(),
        kategori: uploadForm.kategori,
        tanggal: uploadForm.tanggal,
        videoUrl: uploadForm.mediaUrl.trim(),
        thumbnailUrl: uploadForm.thumbnailUrl.trim() || undefined,
        durasi: uploadForm.durasi.trim() || undefined,
        periodeId: 'PRD-2026',
      };
      StorageService.saveVideoKegiatan(newVideo);
      onShowToast('success', 'Video kegiatan berhasil didaftarkan ke galeri PORSENI!');
    }

    loadData();
    setShowUploadModal(false);
    setUploadForm({
      judul: '',
      deskripsi: '',
      kategori: 'PEMBUKAAN',
      tanggal: new Date().toISOString().slice(0, 10),
      mediaUrl: '',
      thumbnailUrl: '',
      durasi: '',
    });
    onRefresh();
  };

  // Handle Save Edited Metadata
  const handleSaveEditedMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.judul.trim()) {
      onShowToast('warning', 'Judul media wajib diisi.');
      return;
    }

    if (editingItem.type === 'FOTO') {
      const current = fotoList.find(f => f.id === editingItem.id);
      if (current) {
        const updated: FotoKegiatan = {
          ...current,
          judul: editingItem.judul.trim(),
          deskripsi: editingItem.deskripsi.trim(),
          kategori: editingItem.kategori,
          tanggal: editingItem.tanggal,
          imageUrl: editingItem.mediaUrl.trim(),
        };
        StorageService.saveFotoKegiatan(updated);
        onShowToast('success', 'Metadata foto berhasil diperbarui.');
      }
    } else {
      const current = videoList.find(v => v.id === editingItem.id);
      if (current) {
        const updated: VideoKegiatan = {
          ...current,
          judul: editingItem.judul.trim(),
          deskripsi: editingItem.deskripsi.trim(),
          kategori: editingItem.kategori,
          tanggal: editingItem.tanggal,
          videoUrl: editingItem.mediaUrl.trim(),
          thumbnailUrl: editingItem.thumbnailUrl?.trim() || undefined,
          durasi: editingItem.durasi?.trim() || undefined,
        };
        StorageService.saveVideoKegiatan(updated);
        onShowToast('success', 'Metadata video berhasil diperbarui.');
      }
    }

    loadData();
    setEditingItem(null);
    onRefresh();
  };

  // Handle Delete
  const handleDeleteItem = (type: 'FOTO' | 'VIDEO', id: string, judul: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus media "${judul}" dari galeri?`)) {
      if (type === 'FOTO') {
        StorageService.deleteFotoKegiatan(id);
      } else {
        StorageService.deleteVideoKegiatan(id);
      }
      loadData();
      onRefresh();
      onShowToast('success', 'Media berhasil dihapus dari galeri.');
    }
  };

  // Combined Media Items for Display
  const allMediaItems = [
    ...fotoList.map(f => ({
      type: 'FOTO' as const,
      id: f.id,
      judul: f.judul,
      deskripsi: f.deskripsi || '',
      kategori: f.kategori,
      tanggal: f.tanggal,
      mediaUrl: f.imageUrl,
      thumbnailUrl: f.imageUrl,
      durasi: undefined,
      raw: f,
    })),
    ...videoList.map(v => ({
      type: 'VIDEO' as const,
      id: v.id,
      judul: v.judul,
      deskripsi: v.deskripsi || '',
      kategori: v.kategori,
      tanggal: v.tanggal,
      mediaUrl: v.videoUrl,
      thumbnailUrl: getVideoThumbnail(v),
      durasi: v.durasi,
      raw: v,
    })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  // Filtered by Tab, Category, and Search
  const filteredItems = allMediaItems.filter(item => {
    const matchTab =
      activeMediaTab === 'SEMUA' ||
      (activeMediaTab === 'FOTO' && item.type === 'FOTO') ||
      (activeMediaTab === 'VIDEO' && item.type === 'VIDEO');

    const matchKategori = filterKategori === 'SEMUA' || item.kategori === filterKategori;

    const matchSearch =
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());

    return matchTab && matchKategori && matchSearch;
  });

  const fotoCount = fotoList.length;
  const videoCount = videoList.length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900">
                Pusat Pengelolaan Galeri Foto & Video Kegiatan
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Unggah, sesuaikan metadata, dan kelola seluruh arsip dokumentasi resmi PORSENI yang ditampilkan pada website publik.
            </p>
          </div>

          <button
            onClick={() => {
              setUploadError('');
              setUploadProgress(null);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Media Baru</span>
          </button>
        </div>

        {/* Media Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Main Media Tabs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveMediaTab('SEMUA')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeMediaTab === 'SEMUA'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Media ({allMediaItems.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('FOTO')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMediaTab === 'FOTO'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Foto Kegiatan ({fotoCount})</span>
            </button>
            <button
              onClick={() => setActiveMediaTab('VIDEO')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMediaTab === 'VIDEO'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Video Kegiatan ({videoCount})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 bg-white"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="PEMBUKAAN">PEMBUKAAN</option>
              <option value="OLAHRAGA">OLAHRAGA</option>
              <option value="SENI">SENI BUDAYA</option>
              <option value="JUARA">JUARA</option>
              <option value="HIGHLIGHT">HIGHLIGHT</option>
              <option value="DOKUMENTASI">DOKUMENTASI</option>
            </select>

            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari judul media..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Media Grid Display */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Belum ada media kegiatan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? `Tidak ditemukan media yang cocok dengan kata kunci "${search}".`
              : 'Silakan klik tombol "Unggah Media Baru" untuk menambahkan dokumentasi foto atau video.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                {/* Media Thumbnail with Badges */}
                <div
                  className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewMedia({ type: item.type, item: item.raw })}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.judul}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Type Badge: Top Left */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 ${
                        item.type === 'FOTO'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.type === 'FOTO' ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : (
                        <VideoIcon className="w-3 h-3" />
                      )}
                      <span>{item.type}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold rounded">
                      {item.kategori}
                    </span>
                  </div>

                  {/* Video Duration Badge: Bottom Right */}
                  {item.durasi && (
                    <div className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono font-bold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{item.durasi}</span>
                    </div>
                  )}

                  {/* Play Button Overlay for Videos */}
                  {item.type === 'VIDEO' && (
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Preview Button for Photos */}
                  {item.type === 'FOTO' && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" />
                      <span>Lihat Penuh</span>
                    </div>
                  )}
                </div>

                {/* Card Content & Metadata */}
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.tanggal}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-500 font-bold">
                      {item.id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                    {item.judul}
                  </h4>

                  {item.deskripsi && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => setPreviewMedia({ type: item.type, item: item.raw })}
                  className="px-2.5 py-1 text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setEditingItem({
                        type: item.type,
                        id: item.id,
                        judul: item.judul,
                        deskripsi: item.deskripsi,
                        kategori: item.kategori,
                        tanggal: item.tanggal,
                        mediaUrl: item.mediaUrl,
                        thumbnailUrl: item.type === 'VIDEO' ? (item.raw as VideoKegiatan).thumbnailUrl : undefined,
                        durasi: item.durasi,
                      })
                    }
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Ubah Informasi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.type, item.id, item.judul)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Hapus Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. MODAL: UNGGAH MEDIA BARU */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Unggah Dokumentasi Media Baru</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="p-5 space-y-4 text-xs">
              {/* Media Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Jenis Media:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('FOTO');
                      setUploadError('');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      uploadType === 'FOTO'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Foto Dokumentasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('VIDEO');
                      setUploadError('');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      uploadType === 'VIDEO'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>Video / Siaran</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Media Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    uploadType === 'FOTO'
                      ? 'Contoh: Kirab Kontingen & Pembukaan PORSENI 2026'
                      : 'Contoh: Cuplikan Laga Final Futsal Putra'
                  }
                  value={uploadForm.judul}
                  onChange={e => setUploadForm({ ...uploadForm, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Media</label>
                  <select
                    value={uploadForm.kategori}
                    onChange={e => setUploadForm({ ...uploadForm, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 bg-white"
                  >
                    <option value="PEMBUKAAN">PEMBUKAAN</option>
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="SENI">SENI BUDAYA</option>
                    <option value="JUARA">PENGANUGERAHAN JUARA</option>
                    <option value="HIGHLIGHT">SOROTAN / HIGHLIGHT</option>
                    <option value="DOKUMENTASI">DOKUMENTASI UMUM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={uploadForm.tanggal}
                    onChange={e => setUploadForm({ ...uploadForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Photo Upload or Video URL */}
              {uploadType === 'FOTO' ? (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Pilih Berkas Foto Dari Perangkat (Maks. 5 MB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFileChange}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                  />

                  {/* Progress bar indicator */}
                  {uploadProgress !== null && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>Memproses berkas...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">Atau masukkan tautan URL gambar online:</div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={uploadForm.mediaUrl}
                    onChange={e => setUploadForm({ ...uploadForm, mediaUrl: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-emerald-600"
                  />

                  {/* Preview Foto */}
                  {uploadForm.mediaUrl && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Pratinjau Foto:
                      </span>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={uploadForm.mediaUrl}
                          alt="Pratinjau"
                          className="max-h-36 w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Video Link & Duration */
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tautan URL Video (YouTube / Google Drive / MP4) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=... atau https://drive.google.com/..."
                      value={uploadForm.mediaUrl}
                      onChange={e => setUploadForm({ ...uploadForm, mediaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mendukung YouTube (watch/shorts/youtu.be), Google Drive shared video link, dan file video direct .mp4.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Estimasi Durasi (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 05:20 atau 15 Menit"
                        value={uploadForm.durasi}
                        onChange={e => setUploadForm({ ...uploadForm, durasi: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        URL Sampul Kustom (Opsional)
                      </label>
                      <input
                        type="url"
                        placeholder="Otomatis jika YouTube"
                        value={uploadForm.thumbnailUrl}
                        onChange={e => setUploadForm({ ...uploadForm, thumbnailUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan suasana momen kegiatan..."
                  value={uploadForm.deskripsi}
                  onChange={e => setUploadForm({ ...uploadForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress !== null}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Simpan Media</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: EDIT METADATA MEDIA */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-emerald-500">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Ubah Informasi {editingItem.type === 'FOTO' ? 'Foto' : 'Video'}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedMetadata} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Media</label>
                <input
                  type="text"
                  required
                  value={editingItem.judul}
                  onChange={e => setEditingItem({ ...editingItem, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingItem.kategori}
                    onChange={e => setEditingItem({ ...editingItem, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PEMBUKAAN">PEMBUKAAN</option>
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="SENI">SENI BUDAYA</option>
                    <option value="JUARA">JUARA</option>
                    <option value="HIGHLIGHT">HIGHLIGHT</option>
                    <option value="DOKUMENTASI">DOKUMENTASI</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={editingItem.tanggal}
                    onChange={e => setEditingItem({ ...editingItem, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan URL Berkas Media</label>
                <input
                  type="url"
                  required
                  value={editingItem.mediaUrl}
                  onChange={e => setEditingItem({ ...editingItem, mediaUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              {editingItem.type === 'VIDEO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Durasi</label>
                    <input
                      type="text"
                      placeholder="05:20"
                      value={editingItem.durasi || ''}
                      onChange={e => setEditingItem({ ...editingItem, durasi: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Sampul Kustom</label>
                    <input
                      type="url"
                      placeholder="URL thumbnail"
                      value={editingItem.thumbnailUrl || ''}
                      onChange={e => setEditingItem({ ...editingItem, thumbnailUrl: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editingItem.deskripsi}
                  onChange={e => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Perbarui Informasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: PREVIEW MEDIA */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate pr-2">
                {previewMedia.type === 'FOTO' ? (
                  <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <VideoIcon className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs font-bold truncate">{previewMedia.item.judul}</span>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Player or Full Image */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {previewMedia.type === 'FOTO' ? (
                <img
                  src={(previewMedia.item as FotoKegiatan).imageUrl}
                  alt={previewMedia.item.judul}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                (() => {
                  const parsed = parseVideoUrl((previewMedia.item as VideoKegiatan).videoUrl);
                  if (parsed.type === 'youtube' && parsed.embedUrl) {
                    return (
                      <iframe
                        src={parsed.embedUrl}
                        title={previewMedia.item.judul}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    );
                  } else if (parsed.type === 'drive' && parsed.embedUrl) {
                    return (
                      <iframe
                        src={parsed.embedUrl}
                        title={previewMedia.item.judul}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                    );
                  } else {
                    return (
                      <video
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        src={(previewMedia.item as VideoKegiatan).videoUrl}
                      >
                        Peramban tidak mendukung video HTML5.
                      </video>
                    );
                  }
                })()
              )}
            </div>

            {/* Details Footer */}
            <div className="p-4 bg-white text-slate-900 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {previewMedia.item.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{previewMedia.item.tanggal}</span>
                {previewMedia.type === 'VIDEO' && (previewMedia.item as VideoKegiatan).durasi && (
                  <span className="text-xs text-slate-500 font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {(previewMedia.item as VideoKegiatan).durasi}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{previewMedia.item.judul}</h4>
              {previewMedia.item.deskripsi && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {previewMedia.item.deskripsi}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
