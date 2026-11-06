import React, { useState, useEffect } from 'react';
import { JadwalKegiatan, Pengumuman } from '../../types';
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
  Download,
  FileText,
} from 'lucide-react';
import { downloadAnnouncementAttachment } from '../../services/announcementDownload';

interface AdminKegiatanProps {
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminKegiatan: React.FC<AdminKegiatanProps> = ({
  onRefresh,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'JADWAL' | 'PENGUMUMAN'>('JADWAL');
  const [jadwalList, setJadwalList] = useState<JadwalKegiatan[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);

  const loadAllData = () => {
    setJadwalList(StorageService.getJadwal());
    setPengumumanList(StorageService.getPengumuman());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- JADWAL FORM & STATE ---
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalKegiatan | null>(null);
  const [jadwalForm, setJadwalForm] = useState({
    kegiatan: '',
    mulai: '',
    selesai: '',
    keterangan: '',
    status: 'AKAN DATANG' as 'SELESAI' | 'BERLANGSUNG' | 'AKAN DATANG',
  });

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

  // --- PENGUMUMAN FORM & STATE ---
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Pengumuman | null>(null);
  const [annForm, setAnnForm] = useState({
    judul: '',
    isi: '',
    kategori: 'PENTING' as 'PENTING' | 'UMUM' | 'JADWAL' | 'HASIL',
    lampiranNama: '',
    lampiranUrl: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
    isNew: true,
  });

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
              Pengelolaan Jadwal & Pengumuman
            </h2>
            <p className="text-xs text-slate-500">
              Atur timeline tahapan kegiatan, agenda pelaksanaan, serta publikasi surat edaran resmi.
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                    lampiranUrl: '',
                    status: 'PUBLISHED',
                    isNew: true,
                  });
                  setShowAnnModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('JADWAL')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'JADWAL' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline Jadwal ({jadwalList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PENGUMUMAN')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'PENGUMUMAN' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Pengumuman & Surat Edaran ({pengumumanList.length})</span>
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
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="Edit Jadwal"
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
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Hapus Jadwal"
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
                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-semibold truncate">{a.lampiranNama}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadAnnouncementAttachment(a)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                      title="Unduh berkas lampiran ini"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh</span>
                    </button>
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
                      lampiranUrl: a.lampiranUrl || '',
                      status: a.status,
                      isNew: a.isNew,
                    });
                    setShowAnnModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
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
                  className="px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
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
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unggah Berkas Lampiran (PDF / Word / Excel / Gambar)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          onShowToast('error', 'Ukuran berkas maksimal 5 MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          setAnnForm(prev => ({
                            ...prev,
                            lampiranNama: file.name,
                            lampiranUrl: dataUrl,
                          }));
                          onShowToast('success', `Berkas "${file.name}" berhasil dimuat!`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Format: PDF, Word (.doc/.docx), Excel (.xlsx), atau Gambar (Maks. 5 MB)
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-0.5 text-[11px]">
                    Nama Label Berkas (Dapat Diedit)
                  </label>
                  <input
                    type="text"
                    value={annForm.lampiranNama}
                    onChange={e => setAnnForm({ ...annForm, lampiranNama: e.target.value })}
                    placeholder="Contoh: Juknis_Porseni_2026.pdf"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {annForm.lampiranNama && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-semibold truncate">{annForm.lampiranNama}</span>
                      {annForm.lampiranUrl?.startsWith('data:') && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          File Siap
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnnForm(prev => ({ ...prev, lampiranNama: '', lampiranUrl: '' }))}
                      className="text-rose-600 hover:text-rose-800 font-bold text-[11px] ml-2 shrink-0"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                )}
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
    </div>
  );
};
