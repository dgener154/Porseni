import React, { useState } from 'react';
import { FotoKegiatan, JadwalKegiatan, Pengumuman } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Calendar,
  Bell,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Clock,
  BookOpen,
  Image as ImageIcon,
  Upload,
  Eye,
} from 'lucide-react';

interface AdminKegiatanProps {
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminKegiatan: React.FC<AdminKegiatanProps> = ({
  onRefresh,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'JADWAL' | 'PENGUMUMAN' | 'FOTO'>('JADWAL');
  const [jadwalList, setJadwalList] = useState<JadwalKegiatan[]>(StorageService.getJadwal());
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(StorageService.getPengumuman());
  const [fotoList, setFotoList] = useState<FotoKegiatan[]>(StorageService.getFotoKegiatan());

  // Foto Form
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<FotoKegiatan | null>(null);
  const [fotoForm, setFotoForm] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'DOKUMENTASI' as 'PEMBUKAAN' | 'OLAHRAGA' | 'SENI' | 'JUARA' | 'DOKUMENTASI',
    tanggal: new Date().toISOString().slice(0, 10),
    imageUrl: '',
  });

  // Handle Photo file select
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('warning', 'Ukuran foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => {
        if (evt.target?.result) {
          setFotoForm(prev => ({ ...prev, imageUrl: evt.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoForm.imageUrl.trim()) {
      onShowToast('warning', 'Silakan pilih berkas foto atau masukkan tautan gambar.');
      return;
    }

    const newId = `FTO-${Date.now()}`;
    const newFoto: FotoKegiatan = {
      id: newId,
      judul: fotoForm.judul.trim(),
      deskripsi: fotoForm.deskripsi.trim(),
      kategori: fotoForm.kategori,
      tanggal: fotoForm.tanggal,
      imageUrl: fotoForm.imageUrl.trim(),
      periodeId: 'PRD-2026',
    };

    StorageService.saveFotoKegiatan(newFoto);
    setFotoList(StorageService.getFotoKegiatan());
    setShowFotoModal(false);
    setFotoForm({
      judul: '',
      deskripsi: '',
      kategori: 'DOKUMENTASI',
      tanggal: new Date().toISOString().slice(0, 10),
      imageUrl: '',
    });
    onRefresh();
    onShowToast('success', 'Foto kegiatan berhasil ditambahkan ke galeri utama website!');
  };

  const handleDeleteFoto = (id: string) => {
    StorageService.deleteFotoKegiatan(id);
    setFotoList(StorageService.getFotoKegiatan());
    onRefresh();
    onShowToast('success', 'Foto kegiatan telah dihapus dari galeri.');
  };

  // Jadwal Form
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalKegiatan | null>(null);
  const [jadwalForm, setJadwalForm] = useState({
    kegiatan: '',
    mulai: '',
    selesai: '',
    keterangan: '',
    status: 'AKAN DATANG' as 'SELESAI' | 'BERLANGSUNG' | 'AKAN DATANG',
  });

  // Pengumuman Form
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Pengumuman | null>(null);
  const [annForm, setAnnForm] = useState({
    judul: '',
    isi: '',
    kategori: 'PENTING' as 'PENTING' | 'UMUM' | 'JADWAL' | 'HASIL',
    lampiranNama: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
    isNew: true,
  });

  // Handle Save Jadwal
  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJadwal) {
      const updated: JadwalKegiatan = {
        ...editingJadwal,
        ...jadwalForm,
      };
      StorageService.saveJadwal(updated);
      onShowToast('success', 'Jadwal berhasil diperbarui.');
    } else {
      const newId = `JDW-${String(jadwalList.length + 1).padStart(2, '0')}`;
      const created: JadwalKegiatan = {
        id: newId,
        tahap: jadwalList.length + 1,
        ...jadwalForm,
      };
      StorageService.saveJadwal(created);
      onShowToast('success', 'Agenda jadwal baru berhasil ditambahkan.');
    }
    setJadwalList(StorageService.getJadwal());
    setShowJadwalModal(false);
    onRefresh();
  };

  // Handle Save Pengumuman
  const handleSaveAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnn) {
      const updated: Pengumuman = {
        ...editingAnn,
        ...annForm,
      };
      StorageService.savePengumuman(updated);
      onShowToast('success', 'Pengumuman berhasil diperbarui.');
    } else {
      const newId = `ANN-${String(pengumumanList.length + 1).padStart(3, '0')}`;
      const created: Pengumuman = {
        id: newId,
        tanggal: new Date().toISOString().slice(0, 10),
        target: 'SEMUA',
        ...annForm,
      };
      StorageService.savePengumuman(created);
      onShowToast('success', 'Pengumuman resmi berhasil dipublikasikan!');
    }
    setPengumumanList(StorageService.getPengumuman());
    setShowAnnModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Pengelolaan Jadwal Tahapan & Pengumuman Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Atur timeline pendaftaran lomba dan terbitkan surat edaran kepada kontingen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'JADWAL' && (
              <button
                onClick={() => {
                  setEditingJadwal(null);
                  setJadwalForm({
                    kegiatan: '',
                    mulai: new Date().toISOString().slice(0, 10),
                    selesai: new Date().toISOString().slice(0, 10),
                    keterangan: '',
                    status: 'AKAN DATANG',
                  });
                  setShowJadwalModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda Jadwal</span>
              </button>
            )}

            {activeTab === 'PENGUMUMAN' && (
              <button
                onClick={() => {
                  setEditingAnn(null);
                  setAnnForm({
                    judul: '',
                    isi: '',
                    kategori: 'PENTING',
                    lampiranNama: '',
                    status: 'PUBLISHED',
                    isNew: true,
                  });
                  setShowAnnModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}

            {activeTab === 'FOTO' && (
              <button
                onClick={() => {
                  setFotoForm({
                    judul: '',
                    deskripsi: '',
                    kategori: 'DOKUMENTASI',
                    tanggal: new Date().toISOString().slice(0, 10),
                    imageUrl: '',
                  });
                  setShowFotoModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Foto Kegiatan Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('JADWAL')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'JADWAL' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline Jadwal Kegiatan ({jadwalList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PENGUMUMAN')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'PENGUMUMAN' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Pengumuman & Surat Edaran ({pengumumanList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('FOTO')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'FOTO' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galeri Foto Website ({fotoList.length})</span>
          </button>
        </div>
      </div>

      {/* Content Tab 1: Jadwal */}
      {activeTab === 'JADWAL' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 text-center w-12">Tahap</th>
                <th className="px-4 py-3">Nama Kegiatan</th>
                <th className="px-4 py-3">Rentang Waktu</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jadwalList.map((j, i) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center font-bold font-mono text-emerald-800">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{j.kegiatan}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                    {j.mulai} s.d {j.selesai}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-sm">{j.keterangan}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'BERLANGSUNG'
                          ? 'bg-amber-100 text-amber-800'
                          : j.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingJadwal(j);
                          setJadwalForm({
                            kegiatan: j.kegiatan,
                            mulai: j.mulai,
                            selesai: j.selesai,
                            keterangan: j.keterangan,
                            status: j.status,
                          });
                          setShowJadwalModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          StorageService.deleteJadwal(j.id);
                          setJadwalList(StorageService.getJadwal());
                          onShowToast('success', 'Agenda jadwal berhasil dihapus.');
                          onRefresh();
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content Tab 2: Pengumuman */}
      {activeTab === 'PENGUMUMAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengumumanList.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {a.kategori}
                  </span>
                  <span className="font-mono text-[11px]">{a.tanggal}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 flex items-center gap-1.5">
                  {a.isNew && (
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white font-extrabold text-[9px] rounded">
                      BARU
                    </span>
                  )}
                  <span>{a.judul}</span>
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {a.isi}
                </p>

                {a.lampiranNama && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Lampiran: {a.lampiranNama}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex justify-end gap-1">
                <button
                  onClick={() => {
                    setEditingAnn(a);
                    setAnnForm({
                      judul: a.judul,
                      isi: a.isi,
                      kategori: a.kategori,
                      lampiranNama: a.lampiranNama || '',
                      status: a.status,
                      isNew: a.isNew,
                    });
                    setShowAnnModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded"
                >
                  Ubah
                </button>
                <button
                  onClick={() => {
                    StorageService.deletePengumuman(a.id);
                    setPengumumanList(StorageService.getPengumuman());
                    onShowToast('success', 'Pengumuman dihapus.');
                    onRefresh();
                  }}
                  className="px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Tab 3: Foto Kegiatan */}
      {activeTab === 'FOTO' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div>
              <span className="font-bold block">Dokumentasi Foto di Halaman Depan Website</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Foto yang Anda unggah di sini akan langsung ditampilkan secara otomatis pada galeri dokumentasi layar utama website publik.
              </p>
            </div>
            <button
              onClick={() => setShowFotoModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Foto Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fotoList.map(foto => (
              <div
                key={foto.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={foto.imageUrl}
                      alt={foto.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full shadow-xs uppercase">
                      {foto.kategori}
                    </span>
                    <button
                      onClick={() => setPreviewFoto(foto)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lihat Penuh</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{foto.tanggal}</span>
                      <span>ID: {foto.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800">
                      {foto.judul}
                    </h4>

                    {foto.deskripsi && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {foto.deskripsi}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex justify-end gap-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleDeleteFoto(foto.id)}
                    className="px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Form Jadwal */}
      {showJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">
              {editingJadwal ? 'Ubah Agenda Jadwal' : 'Tambah Agenda Jadwal Baru'}
            </h3>
            <form onSubmit={handleSaveJadwal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={jadwalForm.kegiatan}
                  onChange={e => setJadwalForm({ ...jadwalForm, kegiatan: e.target.value })}
                  placeholder="Contoh: Technical Meeting..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={jadwalForm.mulai}
                    onChange={e => setJadwalForm({ ...jadwalForm, mulai: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={jadwalForm.selesai}
                    onChange={e => setJadwalForm({ ...jadwalForm, selesai: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Tahapan</label>
                <select
                  value={jadwalForm.status}
                  onChange={e => setJadwalForm({ ...jadwalForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="AKAN DATANG">AKAN DATANG</option>
                  <option value="BERLANGSUNG">BERLANGSUNG (Sedang Berjalan)</option>
                  <option value="SELESAI">SELESAI</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={jadwalForm.keterangan}
                  onChange={e => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJadwalModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Pengumuman */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">
              {editingAnn ? 'Ubah Pengumuman' : 'Terbitkan Pengumuman Baru'}
            </h3>
            <form onSubmit={handleSaveAnn} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={annForm.judul}
                  onChange={e => setAnnForm({ ...annForm, judul: e.target.value })}
                  placeholder="Judul surat edaran atau instruksi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={annForm.kategori}
                  onChange={e => setAnnForm({ ...annForm, kategori: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="PENTING">PENTING</option>
                  <option value="JADWAL">JADWAL</option>
                  <option value="UMUM">UMUM</option>
                  <option value="HASIL">HASIL KEJUARAAN</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan / Edaran</label>
                <textarea
                  rows={4}
                  required
                  value={annForm.isi}
                  onChange={e => setAnnForm({ ...annForm, isi: e.target.value })}
                  placeholder="Ketik rincian pengumuman..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Berkas Lampiran (Opsional)</label>
                <input
                  type="text"
                  value={annForm.lampiranNama}
                  onChange={e => setAnnForm({ ...annForm, lampiranNama: e.target.value })}
                  placeholder="Contoh: Juknis_Lomba_Futsal.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload / Tambah Foto Kegiatan Baru */}
      {showFotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Unggah Foto Dokumentasi Kegiatan</h3>
              </div>
              <button
                onClick={() => setShowFotoModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFoto} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Foto / Momen Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fotoForm.judul}
                  onChange={e => setFotoForm({ ...fotoForm, judul: e.target.value })}
                  placeholder="Contoh: Upacara Pembukaan & Kirab Kontingen..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Foto</label>
                  <select
                    value={fotoForm.kategori}
                    onChange={e => setFotoForm({ ...fotoForm, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-medium"
                  >
                    <option value="PEMBUKAAN">PEMBUKAAN</option>
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="SENI">SENI BUDAYA</option>
                    <option value="JUARA">PENGANUGERAHAN JUARA</option>
                    <option value="DOKUMENTASI">DOKUMENTASI UMUM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Momen</label>
                  <input
                    type="date"
                    required
                    value={fotoForm.tanggal}
                    onChange={e => setFotoForm({ ...fotoForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Unggah Berkas Gambar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Berkas Foto Dari Perangkat (JPG/PNG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                />
              </div>

              {/* Atau URL Gambar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Atau Tautan URL Gambar Online:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/foto-kegiatan.jpg"
                  value={fotoForm.imageUrl}
                  onChange={e => setFotoForm({ ...fotoForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Pratinjau Gambar */}
              {fotoForm.imageUrl && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Pratinjau Foto:
                  </span>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={fotoForm.imageUrl}
                      alt="Pratinjau"
                      className="max-h-40 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea
                  rows={2}
                  value={fotoForm.deskripsi}
                  onChange={e => setFotoForm({ ...fotoForm, deskripsi: e.target.value })}
                  placeholder="Ceritakan momen foto tersebut..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFotoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Simpan & Tampilkan di Beranda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Foto Penuh */}
      {previewFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={previewFoto.imageUrl}
                alt={previewFoto.judul}
                className="max-h-[65vh] w-full object-contain"
              />
              <button
                onClick={() => setPreviewFoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {previewFoto.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{previewFoto.tanggal}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{previewFoto.judul}</h4>
              {previewFoto.deskripsi && (
                <p className="text-xs text-slate-600 mt-1">{previewFoto.deskripsi}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
