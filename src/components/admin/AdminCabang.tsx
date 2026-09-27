import React, { useState } from 'react';
import { CabangLomba, GenderLomba, JenisLomba, KategoriLomba } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/UIComponents';
import {
  Trophy,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  FileCheck,
} from 'lucide-react';

interface AdminCabangProps {
  cabangList: CabangLomba[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminCabang: React.FC<AdminCabangProps> = ({
  cabangList,
  onRefresh,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingCabang, setEditingCabang] = useState<CabangLomba | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CabangLomba | null>(null);

  const [formData, setFormData] = useState<{
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
    dokumenWajib: string;
    status: 'AKTIF' | 'NONAKTIF';
    lokasi: string;
    jadwalPelaksanaan: string;
  }>({
    kode: '',
    nama: '',
    kategori: 'OLAHRAGA',
    jenis: 'INDIVIDU',
    gender: 'PUTRA',
    tingkat: 'MA/SMA/SMK',
    kelompokUmur: 'Maks. 18 Tahun',
    kuotaMaks: 2,
    kuotaMin: 1,
    persyaratan: '',
    dokumenWajib: 'Foto Resmi 3x4, Kartu Pelajar, Akta Kelahiran / KK',
    status: 'AKTIF',
    lokasi: '',
    jadwalPelaksanaan: '',
  });

  const handleOpenCreate = () => {
    setEditingCabang(null);
    setFormData({
      kode: `CB-${String(cabangList.length + 1).padStart(3, '0')}`,
      nama: '',
      kategori: 'OLAHRAGA',
      jenis: 'INDIVIDU',
      gender: 'PUTRA',
      tingkat: 'MA/SMA/SMK',
      kelompokUmur: 'Maks. 18 Tahun',
      kuotaMaks: 2,
      kuotaMin: 1,
      persyaratan: '',
      dokumenWajib: 'Foto Resmi 3x4, Kartu Pelajar, Akta Kelahiran / KK',
      status: 'AKTIF',
      lokasi: 'Gelanggang Olahraga Pusat',
      jadwalPelaksanaan: '26 September 2026',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: CabangLomba) => {
    setEditingCabang(c);
    setFormData({
      kode: c.kode,
      nama: c.nama,
      kategori: c.kategori,
      jenis: c.jenis,
      gender: c.gender,
      tingkat: c.tingkat,
      kelompokUmur: c.kelompokUmur,
      kuotaMaks: c.kuotaMaks,
      kuotaMin: c.kuotaMin,
      persyaratan: c.persyaratan,
      dokumenWajib: c.dokumenWajib.join(', '),
      status: c.status,
      lokasi: c.lokasi || '',
      jadwalPelaksanaan: c.jadwalPelaksanaan || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const docArray = formData.dokumenWajib
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (editingCabang) {
      const updated: CabangLomba = {
        ...editingCabang,
        ...formData,
        dokumenWajib: docArray,
      };
      StorageService.saveCabang(updated);
      StorageService.addAuditLog({
        user: 'admin',
        role: 'ADMIN',
        aktivitas: 'Ubah Master Cabang Lomba',
        rincian: `Memperbarui cabang lomba ${updated.nama} (${updated.id})`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', `Cabang lomba ${updated.nama} berhasil diperbarui.`);
    } else {
      const newId = `CB-${String(cabangList.length + 1).padStart(3, '0')}`;
      const created: CabangLomba = {
        id: newId,
        ...formData,
        dokumenWajib: docArray,
      };
      StorageService.saveCabang(created);
      StorageService.addAuditLog({
        user: 'admin',
        role: 'ADMIN',
        aktivitas: 'Tambah Cabang Lomba',
        rincian: `Menambahkan cabang lomba baru ${created.nama} (${created.id})`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', `Cabang lomba ${created.nama} berhasil ditambahkan!`);
    }

    setShowModal(false);
    onRefresh();
  };

  const filtered = cabangList.filter(c => {
    const matchSearch =
      c.nama.toLowerCase().includes(search.toLowerCase()) ||
      c.kode.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterKategori || c.kategori === filterKategori;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Master Cabang Lomba Olahraga & Seni
            </h2>
            <p className="text-xs text-slate-500">
              Kelola nomor lomba, regulasi teknis, kuota maksimal kontingen, dan syarat berkas wajib.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama cabang..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Kategori (Olahraga & Seni)</option>
              <option value="OLAHRAGA">Khusus Olahraga</option>
              <option value="SENI">Khusus Seni Budaya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {c.kode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.status === 'AKTIF'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                {c.nama}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                {c.kategori} · {c.jenis} · Peserta {c.gender}
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tingkat / Umur:</span>
                  <span className="font-semibold text-slate-800">{c.tingkat} ({c.kelompokUmur})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kuota Lembaga:</span>
                  <span className="font-semibold text-emerald-800">
                    Min {c.kuotaMin} s.d Maks {c.kuotaMaks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi / Jadwal:</span>
                  <span className="text-slate-700">{c.lokasi || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Syarat Berkas Wajib ({c.dokumenWajib.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.dokumenWajib.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(c)}
                className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
              <button
                onClick={() => setDeleteConfirm(c)}
                className="px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL ADD / EDIT CABANG --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <h3 className="text-sm font-bold">
                {editingCabang ? 'Ubah Master Cabang Lomba' : 'Tambah Cabang Lomba Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Cabang</label>
                  <input
                    type="text"
                    required
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value as KategoriLomba })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="SENI">SENI BUDAYA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Cabang Lomba</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Bulutangkis Tunggal Putra..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sifat Lomba</label>
                  <select
                    value={formData.jenis}
                    onChange={e => setFormData({ ...formData, jenis: e.target.value as JenisLomba })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="INDIVIDU">INDIVIDU</option>
                    <option value="BEREGU">BEREGU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as GenderLomba })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="PUTRA">Putra</option>
                    <option value="PUTRI">Putri</option>
                    <option value="CAMPURAN">Campuran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat</label>
                  <select
                    value={formData.tingkat}
                    onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="MA/SMA/SMK">MA / SMA / SMK</option>
                    <option value="MTs/SMP">MTs / SMP</option>
                    <option value="MI/SD">MI / SD</option>
                    <option value="SEMUA">Semua Jenjang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelompok Umur</label>
                  <input
                    type="text"
                    value={formData.kelompokUmur}
                    onChange={e => setFormData({ ...formData, kelompokUmur: e.target.value })}
                    placeholder="Maks. 18 Tahun"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Min.</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.kuotaMin}
                    onChange={e => setFormData({ ...formData, kuotaMin: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Maks. / Lembaga</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.kuotaMaks}
                    onChange={e => setFormData({ ...formData, kuotaMaks: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Persyaratan & Ketentuan Teknis</label>
                <textarea
                  rows={2}
                  value={formData.persyaratan}
                  onChange={e => setFormData({ ...formData, persyaratan: e.target.value })}
                  placeholder="Keterangan regulasi, peralatan, dan tata tertib lomba..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daftar Dokumen Wajib (Pisahkan dengan Koma)
                </label>
                <input
                  type="text"
                  value={formData.dokumenWajib}
                  onChange={e => setFormData({ ...formData, dokumenWajib: e.target.value })}
                  placeholder="Foto Resmi 3x4, Kartu Pelajar, Akta Kelahiran..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Venue / Gedung</label>
                  <input
                    type="text"
                    value={formData.lokasi}
                    onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Contoh: GOR Gelora..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jadwal Tanding</label>
                  <input
                    type="text"
                    value={formData.jadwalPelaksanaan}
                    onChange={e => setFormData({ ...formData, jadwalPelaksanaan: e.target.value })}
                    placeholder="25-28 September 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Hapus Cabang Lomba"
        message={`Apakah Anda yakin ingin menghapus cabang "${deleteConfirm?.nama}"? Seluruh konfigurasi cabang ini akan dihapus.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            StorageService.deleteCabang(deleteConfirm.id);
            StorageService.addAuditLog({
              user: 'admin',
              role: 'ADMIN',
              aktivitas: 'Hapus Cabang Lomba',
              rincian: `Menghapus cabang ${deleteConfirm.nama} (${deleteConfirm.id})`,
              ip: '127.0.0.1',
              status: 'SUKSES',
            });
            onShowToast('success', `Cabang ${deleteConfirm.nama} berhasil dihapus.`);
            setDeleteConfirm(null);
            onRefresh();
          }
        }}
      />
    </div>
  );
};
