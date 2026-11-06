import React, { useState } from 'react';
import { CabangLomba, Lembaga, Peserta, PesertaStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { PesertaStatusBadge, ConfirmModal } from '../common/UIComponents';
import { KartuPesertaView } from '../common/KartuPesertaView';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  Lock,
  Unlock,
  Printer,
  FileCheck2,
  User,
  Building,
  Trophy,
  X,
  MessageCircle,
  Send,
  Trash2,
  CheckSquare,
  Square,
  AlertOctagon,
} from 'lucide-react';

interface AdminVerifikasiPesertaProps {
  pesertaList: Peserta[];
  lembagaList: Lembaga[];
  cabangList: CabangLomba[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminVerifikasiPeserta: React.FC<AdminVerifikasiPesertaProps> = ({
  pesertaList,
  lembagaList,
  cabangList,
  onRefresh,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [filterLembaga, setFilterLembaga] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Selected participant for detailed modal
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [showCardModal, setShowCardModal] = useState<Peserta | null>(null);

  // Action Reason Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    peserta: Peserta | null;
    type: 'VERIFIKASI' | 'TOLAK' | 'PERBAIKAN' | 'BATALKAN';
    reason: string;
  }>({
    isOpen: false,
    peserta: null,
    type: 'VERIFIKASI',
    reason: '',
  });

  // WhatsApp Notification Modal State
  const [waModal, setWaModal] = useState<{
    isOpen: boolean;
    peserta: Peserta | null;
    lembaga: Lembaga | null;
    phone: string;
    tipe: 'SUKSES' | 'PERBAIKAN' | 'TOLAK';
    pesan: string;
  }>({
    isOpen: false,
    peserta: null,
    lembaga: null,
    phone: '',
    tipe: 'SUKSES',
    pesan: '',
  });

  // Checkbox Selection for Rejected Participants
  const [selectedRejectedIds, setSelectedRejectedIds] = useState<string[]>([]);

  // Confirm Delete Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    mode: 'ALL_DITOLAK' | 'SELECTED' | 'SINGLE';
    count: number;
    targetIds: string[];
    singleName?: string;
  }>({
    isOpen: false,
    mode: 'SINGLE',
    count: 0,
    targetIds: [],
  });

  const formatWaPhone = (num: string): string => {
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const generateWaText = (
    peserta: Peserta,
    lembaga: Lembaga | null,
    cabang: CabangLomba | undefined,
    settings: any,
    tipe: 'SUKSES' | 'PERBAIKAN' | 'TOLAK',
    customCatatan?: string
  ): string => {
    const namaKegiatan = settings.namaPorseni || 'PORSENI';
    const tahun = settings.tahun || '2026';
    const namaCabang = cabang?.nama || 'Cabang Lomba';
    const namaLembaga = lembaga?.nama || 'Kontingen Lembaga';
    const catatan = customCatatan || peserta.catatanVerifikasi || '';

    if (tipe === 'SUKSES') {
      return `*PEMBERITAHUAN RESMI PANITIA ${namaKegiatan.toUpperCase()} ${tahun}*

Yth. Pimpinan / Operator *${namaLembaga}*,
Serta ananda *${peserta.nama}*,

Selamat! Berkas dan data pendaftaran peserta berikut telah *DINYATAKAN VALID & TERVERIFIKASI SAH*:

📋 *No. Peserta:* ${peserta.nomorPeserta}
👤 *Nama Peserta:* ${peserta.nama}
🏫 *Lembaga:* ${namaLembaga}
🏆 *Cabang Lomba:* ${namaCabang} (${peserta.kategoriLomba})
🏷️ *Status:* ✅ TERVERIFIKASI (SIAP TANDING)

Kartu Tanda Peserta resmi ber-QR Code telah dapat dicetak melalui akun portal lembaga masing-masing.

Terima kasih atas kerja samanya dan selamat bertanding dengan sportif!

_Sekretariat Panitia Pelaksana ${namaKegiatan}_`;
    }

    if (tipe === 'PERBAIKAN') {
      return `*PEMBERITAHUAN VERIFIKASI BERKAS ${namaKegiatan.toUpperCase()} ${tahun}*

Yth. Operator *${namaLembaga}*,

Mohon perhatian, verifikasi data/berkas peserta atas nama:
👤 *Nama Peserta:* ${peserta.nama}
📋 *No. Peserta:* ${peserta.nomorPeserta}
🏆 *Cabang Lomba:* ${namaCabang}

Memerlukan *PERBAIKAN BERKAS* dengan catatan panitia sebagai berikut:
⚠️ *Catatan Perbaikan:*
_"${catatan || 'Mohon cek kelengkapan dokumen scan berkas asli yang masih buram atau belum lengkap.'}"_

Silakan segera masuk ke portal lembaga Anda untuk memperbaiki dan mengunggah ulang berkas perbaikan sebelum batas waktu penutupan verifikasi.

Terima kasih.

_Panitia Pelaksana ${namaKegiatan}_`;
    }

    // Ditolak
    return `*PEMBERITAHUAN STATUS PESERTA ${namaKegiatan.toUpperCase()} ${tahun}*

Yth. Operator *${namaLembaga}*,

Berdasarkan hasil rapat verifikasi dan validasi keabsahan data ${namaKegiatan} ${tahun}, peserta atas nama:
👤 *Nama Peserta:* ${peserta.nama}
📋 *No. Peserta:* ${peserta.nomorPeserta}
🏆 *Cabang Lomba:* ${namaCabang}

Dinyatakan: ❌ *TIDAK LOLOS VERIFIKASI (DITOLAK)*
Alasan:
_"${catatan || 'Data atau berkas persyaratan teknis tidak memenuhi ketentuan juknis lomba.'}"_

Untuk keterangan lebih lanjut silakan hubungi Sekretariat Panitia Pelaksana. Terima kasih.

_Panitia Pelaksana ${namaKegiatan}_`;
  };

  const openWaNotification = (peserta: Peserta, forceTipe?: 'SUKSES' | 'PERBAIKAN' | 'TOLAK') => {
    const lembaga = lembagaList.find(l => l.id === peserta.lembagaId) || null;
    const cabang = cabangList.find(c => c.id === peserta.cabangId);
    const settings = StorageService.getPengaturan();

    let tipe: 'SUKSES' | 'PERBAIKAN' | 'TOLAK' = 'SUKSES';
    if (forceTipe) {
      tipe = forceTipe;
    } else if (peserta.status === 'PERLU PERBAIKAN') {
      tipe = 'PERBAIKAN';
    } else if (peserta.status === 'DITOLAK') {
      tipe = 'TOLAK';
    } else {
      tipe = 'SUKSES';
    }

    const phone = lembaga?.operatorHp || peserta.nomorHp || lembaga?.pimpinanHp || '';
    const pesan = generateWaText(peserta, lembaga, cabang, settings, tipe, peserta.catatanVerifikasi);

    setWaModal({
      isOpen: true,
      peserta,
      lembaga,
      phone,
      tipe,
      pesan,
    });
  };

  const handleSendWa = () => {
    if (!waModal.phone.trim()) {
      onShowToast('warning', 'Nomor WhatsApp belum diisi.');
      return;
    }
    const cleanNumber = formatWaPhone(waModal.phone);
    const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(waModal.pesan)}`;

    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: 'Kirim Notifikasi WA Verifikasi',
      rincian: `Notifikasi WhatsApp (${waModal.tipe}) untuk ${waModal.peserta?.nama} ke nomor ${cleanNumber}.`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = url;
    }

    onShowToast('success', `Pesan WhatsApp telah disiapkan untuk dikirim ke nomor ${cleanNumber}.`);
    setWaModal(prev => ({ ...prev, isOpen: false }));
  };

  const filtered = pesertaList.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase()) ||
      p.nisn.includes(search);
    const matchLembaga = !filterLembaga || p.lembagaId === filterLembaga;
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchGender = !filterGender || p.jenisKelamin === filterGender;
    return matchSearch && matchLembaga && matchCabang && matchStatus && matchGender;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Rejected participants data calculations
  const allDitolakList = pesertaList.filter(p => p.status === 'DITOLAK');
  const totalDitolakAll = allDitolakList.length;

  const filteredDitolakList = filtered.filter(p => p.status === 'DITOLAK');
  const pageDitolakList = paginated.filter(p => p.status === 'DITOLAK');
  const isAllPageDitolakSelected =
    pageDitolakList.length > 0 &&
    pageDitolakList.every(p => selectedRejectedIds.includes(p.id));

  // Toggle selection for a single rejected participant
  const handleToggleSelectRejected = (p: Peserta) => {
    if (p.status !== 'DITOLAK') {
      onShowToast('warning', 'Hanya data peserta berstatus DITOLAK yang dapat dicentang dan dihapus.');
      return;
    }
    setSelectedRejectedIds(prev =>
      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
    );
  };

  // Toggle selection for all rejected participants on the current page
  const handleToggleSelectAllPage = () => {
    if (pageDitolakList.length === 0) {
      onShowToast('info', 'Tidak ada data berstatus DITOLAK pada halaman ini.');
      return;
    }
    if (isAllPageDitolakSelected) {
      const pageIds = new Set(pageDitolakList.map(p => p.id));
      setSelectedRejectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const combined = new Set([...selectedRejectedIds, ...pageDitolakList.map(p => p.id)]);
      setSelectedRejectedIds(Array.from(combined));
    }
  };

  // Select all filtered rejected participants
  const handleSelectAllFilteredDitolak = () => {
    if (filteredDitolakList.length === 0) {
      onShowToast('info', 'Tidak ada peserta berstatus DITOLAK yang sesuai filter saat ini.');
      return;
    }
    const combined = new Set([...selectedRejectedIds, ...filteredDitolakList.map(p => p.id)]);
    setSelectedRejectedIds(Array.from(combined));
    onShowToast('info', `${filteredDitolakList.length} peserta berstatus DITOLAK telah dicentang.`);
  };

  // Execute deletion of rejected participants
  const handleExecuteDelete = () => {
    if (!confirmDelete.targetIds || confirmDelete.targetIds.length === 0) return;
    const count = confirmDelete.targetIds.length;
    StorageService.deleteMultiplePeserta(confirmDelete.targetIds);

    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: confirmDelete.mode === 'ALL_DITOLAK' ? 'Hapus Total Peserta Ditolak' : 'Hapus Peserta Ditolak',
      rincian: `Menghapus permanen ${count} data peserta berstatus DITOLAK dari sistem verifikasi.`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    const deletedSet = new Set(confirmDelete.targetIds);
    setSelectedRejectedIds(prev => prev.filter(id => !deletedSet.has(id)));
    if (selectedPeserta && deletedSet.has(selectedPeserta.id)) {
      setSelectedPeserta(null);
    }
    setConfirmDelete({ isOpen: false, mode: 'SINGLE', count: 0, targetIds: [] });
    onRefresh();
    onShowToast('success', `Berhasil menghapus ${count} data peserta berstatus DITOLAK.`);
  };

  const openAction = (peserta: Peserta, type: 'VERIFIKASI' | 'TOLAK' | 'PERBAIKAN' | 'BATALKAN') => {
    setActionModal({
      isOpen: true,
      peserta,
      type,
      reason: '',
    });
  };

  const handleExecuteAction = () => {
    const { peserta, type, reason } = actionModal;
    if (!peserta) return;

    if ((type === 'TOLAK' || type === 'PERBAIKAN') && !reason.trim()) {
      onShowToast('warning', 'Alasan penolakan / perbaikan wajib diisi agar dipahami lembaga.');
      return;
    }

    let newStatus: PesertaStatus = peserta.status;
    let lockState = peserta.isLocked;

    if (type === 'VERIFIKASI') {
      newStatus = 'TERVERIFIKASI';
      lockState = true;
    } else if (type === 'TOLAK') {
      newStatus = 'DITOLAK';
      lockState = false;
    } else if (type === 'PERBAIKAN') {
      newStatus = 'PERLU PERBAIKAN';
      lockState = false;
    } else if (type === 'BATALKAN') {
      newStatus = 'MENUNGGU VERIFIKASI';
      lockState = false;
    }

    const updatedPeserta: Peserta = {
      ...peserta,
      status: newStatus,
      isLocked: lockState,
      catatanVerifikasi: reason.trim() || (type === 'VERIFIKASI' ? 'Telah diverifikasi sah oleh Panitia.' : ''),
      updatedAt: new Date().toISOString(),
    };

    StorageService.savePeserta(updatedPeserta);
    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: `Verifikasi Peserta: ${type}`,
      rincian: `${type} peserta ${peserta.nama} (${peserta.nomorPeserta}). Catatan: ${reason || 'N/A'}`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    setActionModal({ isOpen: false, peserta: null, type: 'VERIFIKASI', reason: '' });
    if (selectedPeserta?.id === peserta.id) {
      setSelectedPeserta(updatedPeserta);
    }
    onRefresh();
    onShowToast('success', `Status peserta ${peserta.nama} berhasil diperbarui: ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Advanced Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Verifikasi & Pengesahan Atlet / Seniman
            </h2>
            <p className="text-xs text-slate-500">
              Audit data identitas, foto, dokumen persyaratan, dan tetapkan status keabsahan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-emerald-900 bg-emerald-100 font-bold px-3 py-1.5 rounded-full">
              {filtered.length} Peserta Terfilter
            </span>
            {totalDitolakAll > 0 && (
              <button
                type="button"
                onClick={() => setConfirmDelete({
                  isOpen: true,
                  mode: 'ALL_DITOLAK',
                  count: totalDitolakAll,
                  targetIds: allDitolakList.map(p => p.id),
                })}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Hapus total seluruh data peserta yang berstatus DITOLAK dari sistem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Total Ditolak ({totalDitolakAll})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <input
              type="text"
              placeholder="Cari nama, NISN, atau no..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterLembaga}
              onChange={e => {
                setFilterLembaga(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Kontingen / Lembaga</option>
              {lembagaList.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterCabang}
              onChange={e => {
                setFilterCabang(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Cabang Lomba</option>
              {cabangList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.kategori})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Status</option>
              <option value="MENUNGGU VERIFIKASI">MENUNGGU VERIFIKASI</option>
              <option value="TERVERIFIKASI">TERVERIFIKASI</option>
              <option value="PERLU PERBAIKAN">PERLU PERBAIKAN</option>
              <option value="DITOLAK">DITOLAK</option>
              <option value="FINAL">FINAL</option>
            </select>
          </div>

          <div>
            <select
              value={filterGender}
              onChange={e => {
                setFilterGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Gender</option>
              <option value="L">Putra (L)</option>
              <option value="P">Putri (P)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar for Checked Rejected Items */}
      {selectedRejectedIds.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-950 font-bold">
            <CheckSquare className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              <strong>{selectedRejectedIds.length}</strong> peserta berstatus <span className="bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-extrabold">DITOLAK</span> dipilih untuk dihapus
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFilteredDitolak}
              className="px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 rounded-lg border border-rose-300 transition-colors cursor-pointer"
            >
              Pilih Semua Ditolak ({filteredDitolakList.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedRejectedIds([])}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Batal Pilih
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete({
                isOpen: true,
                mode: 'SELECTED',
                count: selectedRejectedIds.length,
                targetIds: selectedRejectedIds,
              })}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedRejectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Console */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageDitolakSelected}
                    disabled={pageDitolakList.length === 0}
                    onChange={handleToggleSelectAllPage}
                    title={
                      pageDitolakList.length === 0
                        ? 'Tidak ada peserta berstatus DITOLAK pada halaman ini'
                        : 'Centang semua peserta berstatus DITOLAK pada halaman ini'
                    }
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </th>
                <th className="px-3 py-3">No</th>
                <th className="px-4 py-3">No. Peserta</th>
                <th className="px-4 py-3">Nama & NISN</th>
                <th className="px-4 py-3">Lembaga Asal</th>
                <th className="px-4 py-3">Cabang Lomba</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi Cepat Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data peserta yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => {
                  const lembaga = lembagaList.find(l => l.id === p.lembagaId);
                  const cabang = cabangList.find(c => c.id === p.cabangId);
                  const isChecked = selectedRejectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-rose-50/70' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        {p.status === 'DITOLAK' ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRejected(p)}
                            title="Centang untuk menghapus data peserta ditolak ini"
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        ) : (
                          <span
                            className="inline-block w-4 h-4 rounded border border-slate-200 bg-slate-100 cursor-not-allowed opacity-40"
                            title="Hanya data berstatus DITOLAK yang dapat dipilih & dihapus"
                          />
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-emerald-900 block">
                          {p.nomorPeserta}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{p.nama}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          NISN: {p.nisn} · {p.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 block line-clamp-1">
                          {lembaga?.nama || p.lembagaId}
                        </span>
                        <span className="text-[10px] text-slate-500">{lembaga?.kabupatenKota}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-emerald-950 block line-clamp-1">
                          {cabang?.nama}
                        </span>
                        <span className="text-[10px] text-slate-500">{p.kategoriLomba}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PesertaStatusBadge status={p.status} />
                        {p.isLocked && (
                          <span className="flex items-center gap-1 text-[9px] text-slate-500 mt-1">
                            <Lock className="w-2.5 h-2.5" /> Terkunci
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Audit Detail Button */}
                          <button
                            title="Audit Lengkap Dokumen & Data"
                            onClick={() => setSelectedPeserta(p)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Periksa</span>
                          </button>

                          {/* WhatsApp Notification Button */}
                          <button
                            title="Kirim Notifikasi Hasil Verifikasi via WhatsApp"
                            onClick={() => openWaNotification(p)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                          </button>

                          {/* Quick Verify */}
                          {p.status !== 'TERVERIFIKASI' && p.status !== 'FINAL' && (
                            <button
                              title="Sahkan & Verifikasi"
                              onClick={() => openAction(p, 'VERIFIKASI')}
                              className="p-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Request Repair */}
                          <button
                            title="Minta Perbaikan Berkas"
                            onClick={() => openAction(p, 'PERBAIKAN')}
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {/* Reject OR Delete if already rejected */}
                          {p.status === 'DITOLAK' ? (
                            <button
                              title="Hapus Data Peserta Ditolak Ini"
                              onClick={() => setConfirmDelete({
                                isOpen: true,
                                mode: 'SINGLE',
                                count: 1,
                                targetIds: [p.id],
                                singleName: p.nama,
                              })}
                              className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-300 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              title="Tolak Peserta"
                              onClick={() => openAction(p, 'TOLAK')}
                              className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {(currentPage - 1) * rowsPerPage + 1} s.d{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} dari {filtered.length} peserta
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 font-bold text-slate-800">
                Hal. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- AUDIT DETAIL MODAL --- */}
      {selectedPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div>
                <h3 className="text-sm font-bold">Audit & Verifikasi Berkas Peserta</h3>
                <p className="text-xs text-emerald-200">{selectedPeserta.nomorPeserta}</p>
              </div>
              <button
                onClick={() => setSelectedPeserta(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                <div className="w-20 h-28 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedPeserta.fotoUrl ? (
                    <img
                      src={selectedPeserta.fotoUrl}
                      alt={selectedPeserta.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-slate-900">
                      {selectedPeserta.nama}
                    </h4>
                    <PesertaStatusBadge status={selectedPeserta.status} />
                  </div>
                  <p className="text-slate-500 font-mono">
                    NISN: {selectedPeserta.nisn} · NIK: {selectedPeserta.nik} · NIS: {selectedPeserta.nis}
                  </p>
                  <p className="text-slate-700">
                    Lembaga: <strong>{lembagaList.find(l => l.id === selectedPeserta.lembagaId)?.nama}</strong>
                  </p>
                  <p className="text-slate-700">
                    Cabang Lomba:{' '}
                    <strong>
                      {cabangList.find(c => c.id === selectedPeserta.cabangId)?.nama} ({selectedPeserta.kategoriLomba})
                    </strong>
                  </p>
                </div>
              </div>

              {/* Document Checklist for Verification */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs mb-2">
                  Daftar Berkas Persyaratan ({selectedPeserta.dokumenList.length} Berkas)
                </h4>
                <div className="space-y-2">
                  {selectedPeserta.dokumenList.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{doc.jenisDokumen}</span>
                        <span className="text-[11px] text-slate-500">
                          {doc.namaFile ? `File: ${doc.namaFile}` : 'Belum diunggah oleh lembaga'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.namaFile ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.namaFile ? 'Tersedia' : 'Kosong'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan Verifikasi Sebelumnya */}
              {selectedPeserta.catatanVerifikasi && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Verifikasi Terakhir:</span>
                  <p className="text-amber-800 text-[11px]">{selectedPeserta.catatanVerifikasi}</p>
                </div>
              )}

              {/* Action Buttons inside Audit Modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCardModal(selectedPeserta);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Pratinjau Kartu</span>
                  </button>

                  <button
                    onClick={() => openWaNotification(selectedPeserta)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kirim Notifikasi WA</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedPeserta.status === 'DITOLAK' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete({
                          isOpen: true,
                          mode: 'SINGLE',
                          count: 1,
                          targetIds: [selectedPeserta.id],
                          singleName: selectedPeserta.nama,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Peserta Ditolak</span>
                    </button>
                  )}
                  <button
                    onClick={() => openAction(selectedPeserta, 'PERBAIKAN')}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"
                  >
                    Minta Perbaikan
                  </button>
                  <button
                    onClick={() => openAction(selectedPeserta, 'TOLAK')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => openAction(selectedPeserta, 'VERIFIKASI')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                  >
                    Verifikasi Sah
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog Modal (Reason input) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Konfirmasi Tindakan: {actionModal.type} PESERTA
            </h3>
            <p className="text-xs text-slate-600">
              Peserta: <strong>{actionModal.peserta?.nama}</strong> ({actionModal.peserta?.nomorPeserta})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Alasan {actionModal.type === 'VERIFIKASI' ? '(Opsional)' : '(Wajib Diisi)'}
              </label>
              <textarea
                rows={3}
                required={actionModal.type !== 'VERIFIKASI'}
                value={actionModal.reason}
                onChange={e => setActionModal({ ...actionModal, reason: e.target.value })}
                placeholder={
                  actionModal.type === 'PERBAIKAN'
                    ? 'Contoh: Foto kartu pelajar buram, mohon unggah scan yang jelas...'
                    : actionModal.type === 'TOLAK'
                    ? 'Contoh: Usia melebihi batas ketentuan teknis cabang futsal...'
                    : 'Catatan verifikasi...'
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs ${
                  actionModal.type === 'TOLAK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionModal.type === 'PERBAIKAN'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                Simpan & Tetapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Preview Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Kartu Tanda Peserta</h3>
              <button onClick={() => setShowCardModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <KartuPesertaView
              peserta={showCardModal}
              lembaga={lembagaList.find(l => l.id === showCardModal.lembagaId)}
              cabang={cabangList.find(c => c.id === showCardModal.cabangId)}
            />

            <div className="pt-4 text-center">
              <button
                onClick={() => setShowCardModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Notification Modal */}
      {waModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            {/* Header */}
            <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between border-b-2 border-emerald-600">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Kirim Notifikasi WhatsApp</h3>
                  <p className="text-[11px] text-emerald-200">
                    Konfirmasi hasil verifikasi langsung ke peserta / lembaga
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModal(prev => ({ ...prev, isOpen: false }))}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Recipient summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Peserta & Kontingen
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {waModal.peserta?.nama} ({waModal.peserta?.nomorPeserta})
                </h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Lembaga: <strong>{waModal.lembaga?.nama || 'Kontingen Lembaga'}</strong>
                </p>
              </div>

              {/* Status / Tipe Notifikasi Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Jenis Notifikasi yang Dikirim:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!waModal.peserta) return;
                      const c = cabangList.find(cb => cb.id === waModal.peserta?.cabangId);
                      const s = StorageService.getPengaturan();
                      const msg = generateWaText(waModal.peserta, waModal.lembaga, c, s, 'SUKSES');
                      setWaModal(prev => ({ ...prev, tipe: 'SUKSES', pesan: msg }));
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] text-center border transition-all ${
                      waModal.tipe === 'SUKSES'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Terverifikasi
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!waModal.peserta) return;
                      const c = cabangList.find(cb => cb.id === waModal.peserta?.cabangId);
                      const s = StorageService.getPengaturan();
                      const msg = generateWaText(waModal.peserta, waModal.lembaga, c, s, 'PERBAIKAN');
                      setWaModal(prev => ({ ...prev, tipe: 'PERBAIKAN', pesan: msg }));
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] text-center border transition-all ${
                      waModal.tipe === 'PERBAIKAN'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ⚠️ Perlu Perbaikan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!waModal.peserta) return;
                      const c = cabangList.find(cb => cb.id === waModal.peserta?.cabangId);
                      const s = StorageService.getPengaturan();
                      const msg = generateWaText(waModal.peserta, waModal.lembaga, c, s, 'TOLAK');
                      setWaModal(prev => ({ ...prev, tipe: 'TOLAK', pesan: msg }));
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] text-center border transition-all ${
                      waModal.tipe === 'TOLAK'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Ditolak
                  </button>
                </div>
              </div>

              {/* Target Phone Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Penerima (Operator / Siswa):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={waModal.phone}
                    onChange={e => setWaModal(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Otomatis terisi dari kontak terdaftar operator lembaga atau nomor peserta.
                </span>
              </div>

              {/* Message preview / edit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Isi Pesan WhatsApp (Dapat Diedit):
                </label>
                <textarea
                  rows={7}
                  value={waModal.pesan}
                  onChange={e => setWaModal(prev => ({ ...prev, pesan: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-sans text-[11px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWaModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWa}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={
          confirmDelete.mode === 'ALL_DITOLAK'
            ? 'Konfirmasi Hapus Total Peserta Ditolak'
            : confirmDelete.mode === 'SELECTED'
            ? 'Konfirmasi Hapus Peserta Terpilih'
            : 'Konfirmasi Hapus Peserta Ditolak'
        }
        message={
          confirmDelete.mode === 'ALL_DITOLAK'
            ? `Apakah Anda yakin ingin menghapus TOTAL seluruh data peserta yang berstatus DITOLAK (${confirmDelete.count} peserta)? Data peserta yang berstatus TERVERIFIKASI, MENUNGGU VERIFIKASI, dan PERLU PERBAIKAN dipastikan tetap aman dan tidak terhapus.`
            : confirmDelete.mode === 'SELECTED'
            ? `Apakah Anda yakin ingin menghapus permanen ${confirmDelete.count} data peserta berstatus DITOLAK yang telah dicentang?`
            : `Hapus permanen data peserta "${confirmDelete.singleName}" yang berstatus DITOLAK dari database?`
        }
        confirmLabel={
          confirmDelete.mode === 'ALL_DITOLAK'
            ? `Ya, Hapus Total (${confirmDelete.count})`
            : `Ya, Hapus Data (${confirmDelete.count})`
        }
        cancelLabel="Batal"
        confirmVariant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, mode: 'SINGLE', count: 0, targetIds: [] })}
      />
    </div>
  );
};
