import React, { useState, useMemo } from 'react';
import { CabangLomba, DokumenPeserta, Lembaga, Peserta, PesertaStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { PesertaStatusBadge, ConfirmModal } from '../common/UIComponents';
import { KartuPesertaView } from '../common/KartuPesertaView';
import { getOpsiKelasByJenjang, getLabelJenjang } from '../../utils/jenjangHelper';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Upload,
  Printer,
  Lock,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  X,
  FileCheck,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface LembagaPesertaProps {
  lembaga: Lembaga;
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaPeserta: React.FC<LembagaPesertaProps> = ({
  lembaga,
  pesertaList,
  cabangList,
  onRefresh,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);
  const [viewingDetailPeserta, setViewingDetailPeserta] = useState<Peserta | null>(null);
  const [viewingKartuPeserta, setViewingKartuPeserta] = useState<Peserta | null>(null);
  const [deleteConfirmPeserta, setDeleteConfirmPeserta] = useState<Peserta | null>(null);
  const [managingDocsPeserta, setManagingDocsPeserta] = useState<Peserta | null>(null);

  // Dynamic class options based on Lembaga's educational level (jenjang)
  const opsiKelas = useMemo(() => getOpsiKelasByJenjang(lembaga.jenjang), [lembaga.jenjang]);

  // Form inputs state
  const [formInput, setFormInput] = useState({
    nis: '',
    nisn: '',
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L' as 'L' | 'P',
    kelas: '',
    tingkat: lembaga.jenjang,
    cabangId: cabangList[0]?.id || '',
    kategoriLomba: cabangList[0]?.kategori || 'OLAHRAGA',
    pembimbingNama: '',
    pembimbingHp: '',
    nomorHp: '',
    email: '',
    alamat: '',
    fotoUrl: '',
    status: 'MENUNGGU VERIFIKASI' as PesertaStatus,
  });

  const [formError, setFormError] = useState('');

  // Handle opening Create Form
  const handleOpenCreate = () => {
    if (lembaga.status !== 'AKTIF') {
      onShowToast(
        'warning',
        'Akun lembaga Anda belum diverifikasi aktif. Belum dapat mendaftarkan peserta.'
      );
      return;
    }

    const initialKelas = opsiKelas[0] || 'Kelas X';

    setEditingPeserta(null);
    setFormInput({
      nis: '',
      nisn: '',
      nik: '',
      nama: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'L',
      kelas: initialKelas,
      tingkat: lembaga.jenjang,
      cabangId: cabangList[0]?.id || '',
      kategoriLomba: cabangList[0]?.kategori || 'OLAHRAGA',
      pembimbingNama: '',
      pembimbingHp: '',
      nomorHp: '',
      email: '',
      alamat: '',
      fotoUrl: '',
      status: 'MENUNGGU VERIFIKASI',
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Handle opening Edit Form
  const handleOpenEdit = (p: Peserta) => {
    if (p.isLocked) {
      onShowToast(
        'error',
        'Data peserta ini telah diverifikasi/dikunci oleh Panitia. Perubahan data harus melalui pengajuan revisi ke admin.'
      );
      return;
    }

    setEditingPeserta(p);
    setFormInput({
      nis: p.nis,
      nisn: p.nisn,
      nik: p.nik,
      nama: p.nama,
      tempatLahir: p.tempatLahir,
      tanggalLahir: p.tanggalLahir,
      jenisKelamin: p.jenisKelamin,
      kelas: p.kelas,
      tingkat: p.tingkat,
      cabangId: p.cabangId,
      kategoriLomba: p.kategoriLomba,
      pembimbingNama: p.pembimbingNama || '',
      pembimbingHp: p.pembimbingHp || '',
      nomorHp: p.nomorHp || '',
      email: p.email || '',
      alamat: p.alamat || '',
      fotoUrl: p.fotoUrl || '',
      status: p.status,
    });
    setFormError('');
    setShowFormModal(true);
  };

  // When changing cabang in form, sync category
  const handleCabangChange = (cabangId: string) => {
    const selected = cabangList.find(c => c.id === cabangId);
    setFormInput(prev => ({
      ...prev,
      cabangId,
      kategoriLomba: selected?.kategori || 'OLAHRAGA',
    }));
  };

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanNis = formInput.nis.trim();
    const cleanNisn = formInput.nisn.trim();
    const cleanNik = formInput.nik.trim();
    const cleanNama = formInput.nama.trim();

    // 1. Mandatory Validations
    if (!cleanNama || !cleanNis || !cleanNisn || !cleanNik || !formInput.tanggalLahir) {
      setFormError('Harap lengkapi seluruh kolom wajib bertanda bintang (*).');
      return;
    }

    if (!/^\d{10}$/.test(cleanNisn)) {
      setFormError('NISN harus 10 digit angka valid.');
      return;
    }

    if (!/^\d{16}$/.test(cleanNik)) {
      setFormError('NIK harus 16 digit angka valid.');
      return;
    }

    // 2. Duplication Checks against all participants (excluding currently edited)
    const allPeserta = StorageService.getPeserta();
    const duplicateNis = allPeserta.find(
      p => p.nis.toLowerCase() === cleanNis.toLowerCase() && p.id !== editingPeserta?.id
    );
    if (duplicateNis) {
      setFormError(`NIS "${cleanNis}" sudah terdaftar atas nama ${duplicateNis.nama}.`);
      return;
    }

    const duplicateNisn = allPeserta.find(
      p => p.nisn === cleanNisn && p.id !== editingPeserta?.id
    );
    if (duplicateNisn) {
      setFormError(`NISN "${cleanNisn}" sudah terdaftar atas nama ${duplicateNisn.nama}.`);
      return;
    }

    const duplicateNik = allPeserta.find(
      p => p.nik === cleanNik && p.id !== editingPeserta?.id
    );
    if (duplicateNik) {
      setFormError(`NIK "${cleanNik}" sudah terdaftar atas nama ${duplicateNik.nama}.`);
      return;
    }

    // 3. Gender check according to branch rules
    const branch = cabangList.find(c => c.id === formInput.cabangId);
    if (branch) {
      if (branch.gender === 'PUTRA' && formInput.jenisKelamin !== 'L') {
        setFormError(`Cabang "${branch.nama}" khusus untuk peserta Putra (L).`);
        return;
      }
      if (branch.gender === 'PUTRI' && formInput.jenisKelamin !== 'P') {
        setFormError(`Cabang "${branch.nama}" khusus untuk peserta Putri (P).`);
        return;
      }

      // Quota check for this institution
      const countInBranch = allPeserta.filter(
        p =>
          p.lembagaId === lembaga.id &&
          p.cabangId === formInput.cabangId &&
          p.id !== editingPeserta?.id
      ).length;
      if (countInBranch >= branch.kuotaMaks) {
        setFormError(
          `Kuota lembaga Anda untuk cabang "${branch.nama}" sudah mencapai batas maksimal (${branch.kuotaMaks} peserta).`
        );
        return;
      }
    }

    // Age / Birth year check (Max 18 years for MA/SMA)
    const birthYear = new Date(formInput.tanggalLahir).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age > 19 || age < 10) {
      setFormError(`Usia peserta (${age} tahun) tidak memenuhi ketentuan kelompok umur lomba.`);
      return;
    }

    // Save
    const settings = StorageService.getPengaturan();
    if (editingPeserta) {
      const updated: Peserta = {
        ...editingPeserta,
        ...formInput,
        nis: cleanNis,
        nisn: cleanNisn,
        nik: cleanNik,
        nama: cleanNama,
        status: editingPeserta.status === 'PERLU PERBAIKAN' ? 'MENUNGGU VERIFIKASI' : editingPeserta.status,
      };
      StorageService.savePeserta(updated);
      StorageService.addAuditLog({
        user: lembaga.operatorNama,
        role: 'LEMBAGA',
        aktivitas: 'Ubah Data Peserta',
        rincian: `Memperbarui data peserta ${updated.nama} (${updated.id})`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', `Data peserta ${updated.nama} berhasil diperbarui.`);
    } else {
      const newId = StorageService.generatePesertaId();
      const newNomor = StorageService.generateNomorPeserta();
      const requiredDocs = branch?.dokumenWajib || ['Foto Resmi 3x4', 'Kartu Pelajar'];

      const created: Peserta = {
        id: newId,
        nomorPeserta: newNomor,
        lembagaId: lembaga.id,
        nis: cleanNis,
        nisn: cleanNisn,
        nik: cleanNik,
        nama: cleanNama,
        tempatLahir: formInput.tempatLahir,
        tanggalLahir: formInput.tanggalLahir,
        jenisKelamin: formInput.jenisKelamin,
        kelas: formInput.kelas,
        tingkat: formInput.tingkat,
        cabangId: formInput.cabangId,
        kategoriLomba: formInput.kategoriLomba,
        pembimbingNama: formInput.pembimbingNama,
        pembimbingHp: formInput.pembimbingHp,
        nomorHp: formInput.nomorHp,
        email: formInput.email,
        alamat: formInput.alamat,
        fotoUrl: formInput.fotoUrl,
        status: 'MENUNGGU VERIFIKASI',
        dokumenList: requiredDocs.map((doc, idx) => ({
          id: `DOC-${newId.replace('PS-', '')}-${idx + 1}`,
          jenisDokumen: doc,
          namaFile: '',
          fileUrl: '',
          status: 'MENUNGGU',
          uploadedAt: new Date().toISOString(),
        })),
        isLocked: false,
        periodeId: settings.aktifPeriodeId || 'PRD-2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.savePeserta(created);
      StorageService.addAuditLog({
        user: lembaga.operatorNama,
        role: 'LEMBAGA',
        aktivitas: 'Tambah Peserta Baru',
        rincian: `Mendaftarkan peserta baru ${created.nama} (${created.nomorPeserta})`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', `Peserta ${created.nama} berhasil didaftarkan!`);
    }

    setShowFormModal(false);
    onRefresh();
  };

  // Handle Photo upload in form
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        onShowToast('warning', 'Ukuran foto terlalu besar. Maksimal 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        setFormInput(prev => ({
          ...prev,
          fotoUrl: (event.target?.result as string) || '',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Document upload for a specific participant
  const handleDocumentFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!managingDocsPeserta || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('warning', 'Ukuran berkas terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64Url = (event.target?.result as string) || '';
      const updatedDocs = managingDocsPeserta.dokumenList.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            namaFile: file.name,
            fileUrl: base64Url,
            status: 'MENUNGGU' as const,
            uploadedAt: new Date().toISOString(),
          };
        }
        return d;
      });

      const updatedPeserta: Peserta = {
        ...managingDocsPeserta,
        dokumenList: updatedDocs,
      };

      StorageService.savePeserta(updatedPeserta);
      setManagingDocsPeserta(updatedPeserta);
      onRefresh();
      onShowToast('success', `Dokumen "${file.name}" berhasil diunggah.`);
    };
    reader.readAsDataURL(file);
  };

  // Filtered & Paginated List
  const filteredList = pesertaList.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nisn.includes(search) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase());
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchCabang && matchStatus;
  });

  const totalPages = Math.ceil(filteredList.length / rowsPerPage) || 1;
  const paginatedList = filteredList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Peserta & Atlet Kontingen
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola data atlet dan seniman kontingen {lembaga.nama} ({pesertaList.length} peserta terdaftar).
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peserta Baru</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau no. peserta..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterCabang}
              onChange={e => {
                setFilterCabang(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="DRAFT">DRAFT</option>
              <option value="MENUNGGU VERIFIKASI">MENUNGGU VERIFIKASI</option>
              <option value="PERLU PERBAIKAN">PERLU PERBAIKAN</option>
              <option value="TERVERIFIKASI">TERVERIFIKASI</option>
              <option value="FINAL">FINAL</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">No. Peserta</th>
                <th className="px-4 py-3">Nama & NISN</th>
                <th className="px-4 py-3">Cabang Lomba</th>
                <th className="px-4 py-3">JK / Kelas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Berkas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">Tidak ada data peserta ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || filterCabang || filterStatus
                        ? 'Coba atur ulang kata kunci atau filter pencarian.'
                        : 'Klik tombol "+ Tambah Peserta Baru" untuk mendaftarkan atlet pertama.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((p, idx) => {
                  const cabang = cabangList.find(c => c.id === p.cabangId);
                  const validDocsCount = p.dokumenList.filter(d => !!d.namaFile).length;
                  const totalDocs = p.dokumenList.length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-emerald-900 block">
                          {p.nomorPeserta}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {p.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{p.nama}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          NISN: {p.nisn} · NIK: {p.nik}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 block line-clamp-1">
                          {cabang?.nama || p.cabangId}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {p.kategoriLomba} ({cabang?.jenis || 'INDIVIDU'})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span>{p.jenisKelamin === 'L' ? 'L (Putra)' : 'P (Putri)'}</span>
                        <span className="text-[10px] text-slate-400 block">{p.kelas}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PesertaStatusBadge status={p.status} />
                        {p.isLocked && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 mt-1 font-semibold">
                            <Lock className="w-2.5 h-2.5" /> Terkunci
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setManagingDocsPeserta(p)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                            validDocsCount === totalDocs
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {validDocsCount}/{totalDocs} Berkas
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detail */}
                          <button
                            title="Lihat Detail Peserta"
                            onClick={() => setViewingDetailPeserta(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Pratinjau Kartu Peserta (Hanya data terverifikasi) */}
                          <button
                            title="Pratinjau Kartu Peserta"
                            disabled={p.status !== 'TERVERIFIKASI' && p.status !== 'FINAL'}
                            onClick={() => setViewingKartuPeserta(p)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Ubah Data"
                            disabled={p.isLocked}
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Hapus Data"
                            disabled={p.isLocked}
                            onClick={() => setDeleteConfirmPeserta(p)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              {Math.min(currentPage * rowsPerPage, filteredList.length)} dari {filteredList.length} data
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

      {/* --- MODAL 1: ADD / EDIT PESERTA FORM --- */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <h3 className="text-sm font-bold tracking-wide">
                {editingPeserta ? 'Ubah Data Peserta / Atlet' : 'Formulir Pendaftaran Atlet / Seniman'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo & Basic Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-3 border-b border-slate-100">
                {/* Photo Preview & Selector */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-32 rounded-lg border-2 border-dashed border-emerald-600 bg-slate-50 overflow-hidden flex items-center justify-center mb-2 relative">
                    {formInput.fotoUrl ? (
                      <img
                        src={formInput.fotoUrl}
                        alt="Pasfoto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <User className="w-8 h-8 mx-auto text-slate-300" />
                        <span className="text-[10px] text-slate-500 block mt-1">Pasfoto 3x4</span>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
                    <span>{formInput.fotoUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Peserta <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formInput.nama}
                      onChange={e => setFormInput({ ...formInput, nama: e.target.value })}
                      placeholder="Nama lengkap sesuai akta / rapor..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NISN (10 Digit) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={formInput.nisn}
                        onChange={e => setFormInput({ ...formInput, nisn: e.target.value })}
                        placeholder="Contoh: 0071234567"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIK (16 Digit) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={formInput.nik}
                        onChange={e => setFormInput({ ...formInput, nik: e.target.value })}
                        placeholder="16 digit NIK..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Siswa (NIS) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formInput.nis}
                      onChange={e => setFormInput({ ...formInput, nis: e.target.value })}
                      placeholder="Nomor induk di sekolah..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Birth & Gender & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tempat Lahir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formInput.tempatLahir}
                    onChange={e => setFormInput({ ...formInput, tempatLahir: e.target.value })}
                    placeholder="Kota kelahiran..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formInput.tanggalLahir}
                    onChange={e => setFormInput({ ...formInput, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formInput.jenisKelamin}
                    onChange={e => setFormInput({ ...formInput, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="L">Laki-Laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>

              {/* Branch Selection & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cabang Lomba yang Diikuti <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formInput.cabangId}
                    onChange={e => handleCabangChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {cabangList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.gender} - {c.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Kelas Siswa / Mahasiswa <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Jenjang {getLabelJenjang(lembaga.jenjang)}
                    </span>
                  </div>
                  <select
                    required
                    value={formInput.kelas}
                    onChange={e => setFormInput({ ...formInput, kelas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {opsiKelas.map(k => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    {formInput.kelas && !opsiKelas.includes(formInput.kelas) && (
                      <option key={formInput.kelas} value={formInput.kelas}>
                        {formInput.kelas}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Coach / Pembimbing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pembimbing / Pelatih
                  </label>
                  <input
                    type="text"
                    value={formInput.pembimbingNama}
                    onChange={e => setFormInput({ ...formInput, pembimbingNama: e.target.value })}
                    placeholder="Nama guru/pelatih pembina..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp Pembimbing
                  </label>
                  <input
                    type="tel"
                    value={formInput.pembimbingHp}
                    onChange={e => setFormInput({ ...formInput, pembimbingHp: e.target.value })}
                    placeholder="081234567890..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Data Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: UPLOAD & VERIFY DOKUMEN CHECKLIST --- */}
      {managingDocsPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div>
                <h3 className="text-sm font-bold">Berkas & Dokumen Persyaratan</h3>
                <p className="text-xs text-emerald-200">
                  {managingDocsPeserta.nama} ({managingDocsPeserta.nomorPeserta})
                </p>
              </div>
              <button
                onClick={() => setManagingDocsPeserta(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Berikut adalah daftar berkas wajib yang dipersyaratkan untuk cabang lomba yang dipilih.
                Pastikan dokumen terbaca dengan jelas dalam format PDF atau Gambar (JPG/PNG).
              </p>

              <div className="space-y-3">
                {managingDocsPeserta.dokumenList.map(doc => {
                  const isUploaded = !!doc.namaFile;
                  return (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {isUploaded ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.jenisDokumen}</span>
                          <span className="text-[11px] text-slate-500">
                            {doc.namaFile ? `File: ${doc.namaFile}` : 'Belum diunggah'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status && isUploaded && (
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              doc.status === 'VALID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'TIDAK VALID'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {doc.status}
                          </span>
                        )}

                        <label className="cursor-pointer px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-700 transition-colors">
                          <span>{isUploaded ? 'Ganti' : 'Unggah'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => handleDocumentFileChange(doc.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setManagingDocsPeserta(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CETAK KARTU PESERTA --- */}
      {viewingKartuPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Kartu Peserta Resmi
              </h3>
              <button
                onClick={() => setViewingKartuPeserta(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <KartuPesertaView
              peserta={viewingKartuPeserta}
              lembaga={lembaga}
              cabang={cabangList.find(c => c.id === viewingKartuPeserta.cabangId)}
              showPrintActions={false}
            />

            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <button
                onClick={() => setViewingKartuPeserta(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DETAIL PESERTA DENGAN TAB LENGKAP --- */}
      {viewingDetailPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div>
                <h3 className="text-sm font-bold">Rincian Lengkap Peserta</h3>
                <p className="text-xs text-emerald-200">{viewingDetailPeserta.nomorPeserta}</p>
              </div>
              <button
                onClick={() => setViewingDetailPeserta(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-20 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {viewingDetailPeserta.fotoUrl ? (
                    <img
                      src={viewingDetailPeserta.fotoUrl}
                      alt={viewingDetailPeserta.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{viewingDetailPeserta.nama}</h4>
                  <p className="text-slate-500 font-mono">NISN: {viewingDetailPeserta.nisn} · NIS: {viewingDetailPeserta.nis}</p>
                  <p className="text-slate-500 font-mono">NIK: {viewingDetailPeserta.nik}</p>
                  <div className="mt-1">
                    <PesertaStatusBadge status={viewingDetailPeserta.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tempat, Tgl Lahir</span>
                  <span className="font-semibold">{viewingDetailPeserta.tempatLahir}, {viewingDetailPeserta.tanggalLahir}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Jenis Kelamin / Kelas</span>
                  <span className="font-semibold">{viewingDetailPeserta.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'} · Kelas {viewingDetailPeserta.kelas}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cabang Lomba</span>
                  <span className="font-semibold">
                    {cabangList.find(c => c.id === viewingDetailPeserta.cabangId)?.nama || viewingDetailPeserta.cabangId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pembimbing</span>
                  <span className="font-semibold">{viewingDetailPeserta.pembimbingNama || '-'}</span>
                </div>
              </div>

              {viewingDetailPeserta.catatanVerifikasi && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Verifikator Panitia:</span>
                  <p className="text-amber-800 text-[11px]">{viewingDetailPeserta.catatanVerifikasi}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                {viewingDetailPeserta.status === 'TERVERIFIKASI' && (
                  <button
                    onClick={() => {
                      setViewingKartuPeserta(viewingDetailPeserta);
                      setViewingDetailPeserta(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Kartu</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingDetailPeserta(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={!!deleteConfirmPeserta}
        title="Konfirmasi Penghapusan Peserta"
        message={`Apakah Anda yakin ingin menghapus data peserta "${deleteConfirmPeserta?.nama}" (${deleteConfirmPeserta?.nomorPeserta})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Peserta"
        confirmVariant="danger"
        onCancel={() => setDeleteConfirmPeserta(null)}
        onConfirm={() => {
          if (deleteConfirmPeserta) {
            StorageService.deletePeserta(deleteConfirmPeserta.id);
            StorageService.addAuditLog({
              user: lembaga.operatorNama,
              role: 'LEMBAGA',
              aktivitas: 'Hapus Peserta',
              rincian: `Menghapus peserta ${deleteConfirmPeserta.nama} (${deleteConfirmPeserta.id})`,
              ip: '127.0.0.1',
              status: 'SUKSES',
            });
            onShowToast('success', `Peserta ${deleteConfirmPeserta.nama} berhasil dihapus.`);
            setDeleteConfirmPeserta(null);
            onRefresh();
          }
        }}
      />
    </div>
  );
};
