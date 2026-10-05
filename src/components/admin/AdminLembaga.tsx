import React, { useState } from 'react';
import { JenjangLembaga, Lembaga, LembagaStatus, Peserta } from '../../types';
import { StorageService, hashPassword } from '../../services/storage';
import { ExcelService } from '../../services/excel';
import { LembagaStatusBadge, ConfirmModal } from '../common/UIComponents';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  Shield,
  X,
  Plus,
} from 'lucide-react';

interface AdminLembagaProps {
  lembagaList: Lembaga[];
  pesertaList: Peserta[];
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminLembaga: React.FC<AdminLembagaProps> = ({
  lembagaList,
  pesertaList,
  onRefresh,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [selectedLembaga, setSelectedLembaga] = useState<Lembaga | null>(null);

  // Status Action Modal
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    lembaga: Lembaga | null;
    targetStatus: LembagaStatus;
    reason: string;
  }>({
    isOpen: false,
    lembaga: null,
    targetStatus: 'AKTIF',
    reason: '',
  });

  // Reset Password Modal
  const [resetPwModal, setResetPwModal] = useState<{
    isOpen: boolean;
    lembaga: Lembaga | null;
    newPw: string;
  }>({
    isOpen: false,
    lembaga: null,
    newPw: '123456',
  });

  // Modal Pendaftaran Awal Lembaga oleh Admin (6 fields only)
  const [showAddLembagaModal, setShowAddLembagaModal] = useState(false);
  const [formLembaga, setFormLembaga] = useState({
    npsn: '',
    nsm: '',
    nama: '',
    jenjang: 'MA/SMA/SMK' as JenjangLembaga,
    statusLembaga: 'NEGERI' as 'NEGERI' | 'SWASTA',
    emailLembaga: '',
  });

  const handleRegisterLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formLembaga.emailLembaga.trim().toLowerCase();
    const cleanNpsn = formLembaga.npsn.trim();
    const cleanNama = formLembaga.nama.trim();

    if (!cleanNpsn || !cleanNama || !cleanEmail) {
      onShowToast('warning', 'NPSN, Nama Lembaga, dan Email Lembaga wajib diisi.');
      return;
    }

    // Check duplicate email
    const existing = lembagaList.find(
      l =>
        (l.emailLembaga || l.operatorEmail || l.username || '').toLowerCase() === cleanEmail ||
        l.npsn === cleanNpsn
    );
    if (existing) {
      onShowToast('error', `Lembaga dengan Email atau NPSN tersebut sudah terdaftar (${existing.nama}).`);
      return;
    }

    const defaultPw = '123456';
    const hash = await hashPassword(defaultPw);
    const newId = `LG-2026-${String(lembagaList.length + 1).padStart(5, '0')}`;
    const kode = cleanNama.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'LMBG';

    const newLembaga: Lembaga = {
      id: newId,
      kodeLembaga: kode,
      nama: cleanNama,
      npsn: cleanNpsn,
      nsm: formLembaga.nsm.trim() || undefined,
      jenjang: formLembaga.jenjang,
      statusLembaga: formLembaga.statusLembaga,
      emailLembaga: cleanEmail,
      status: 'AKTIF',
      alamat: 'Belum diisi (dapat dilengkapi di menu profil lembaga)',
      desaKelurahan: '-',
      kecamatan: '-',
      kabupatenKota: '-',
      provinsi: '-',
      kodePos: '-',
      pimpinanNama: `Kepala ${cleanNama}`,
      pimpinanHp: '-',
      pimpinanEmail: cleanEmail,
      operatorNama: `Operator ${cleanNama}`,
      operatorNik: '-',
      operatorHp: '-',
      operatorEmail: cleanEmail,
      username: cleanEmail,
      passwordHash: hash,
      periodeId: 'PRD-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveLembaga(newLembaga);

    // Create User account with email as login username and password 123456
    const newUser = {
      id: `USR-${Date.now()}`,
      username: cleanEmail,
      email: cleanEmail,
      role: 'LEMBAGA' as const,
      lembagaId: newId,
      namaLengkap: cleanNama,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveUser(newUser);

    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: 'Pendaftaran Lembaga Baru',
      rincian: `Admin mendaftarkan ${cleanNama} (NPSN: ${cleanNpsn}, Email: ${cleanEmail}). Akun login otomatis dibuat dengan sandi default 123456.`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    setShowAddLembagaModal(false);
    setFormLembaga({
      npsn: '',
      nsm: '',
      nama: '',
      jenjang: 'MA/SMA/SMK',
      statusLembaga: 'NEGERI',
      emailLembaga: '',
    });
    onRefresh();
    onShowToast('success', `Lembaga "${cleanNama}" berhasil didaftarkan! Akun Login: ${cleanEmail}, Password Default: 123456`);
  };

  const filtered = lembagaList.filter(l => {
    const matchSearch =
      l.nama.toLowerCase().includes(search.toLowerCase()) ||
      l.npsn.includes(search) ||
      l.id.toLowerCase().includes(search.toLowerCase()) ||
      l.kabupatenKota.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchJenjang = !filterJenjang || l.jenjang === filterJenjang;
    return matchSearch && matchStatus && matchJenjang;
  });

  const handleApplyStatus = () => {
    const { lembaga, targetStatus, reason } = statusModal;
    if (!lembaga) return;

    const updated: Lembaga = {
      ...lembaga,
      status: targetStatus,
      catatanVerifikasi: reason.trim() || `Status ditetapkan menjadi ${targetStatus} oleh panitia pusat.`,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveLembaga(updated);
    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: `Ubah Status Lembaga: ${targetStatus}`,
      rincian: `Lembaga ${lembaga.nama} (${lembaga.id}) diubah menjadi ${targetStatus}. Alasan: ${reason || 'N/A'}`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    setStatusModal({ isOpen: false, lembaga: null, targetStatus: 'AKTIF', reason: '' });
    onRefresh();
    onShowToast('success', `Status lembaga ${lembaga.nama} berhasil diubah menjadi: ${targetStatus}`);
  };

  const handleResetOperatorPassword = async () => {
    const { lembaga, newPw } = resetPwModal;
    if (!lembaga || !newPw) return;

    const hash = await hashPassword(newPw);
    const updated: Lembaga = {
      ...lembaga,
      passwordHash: hash,
    };
    StorageService.saveLembaga(updated);

    // Also update associated user
    const users = StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === lembaga.username.toLowerCase());
    if (user) {
      user.passwordHash = hash;
      StorageService.saveUser(user);
    }

    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: 'Reset Password Operator',
      rincian: `Mereset kata sandi operator lembaga ${lembaga.nama} (${lembaga.username})`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    setResetPwModal({ isOpen: false, lembaga: null, newPw: 'password123' });
    onShowToast('success', `Kata sandi operator ${lembaga.nama} berhasil direset ke: "${newPw}".`);
  };

  const handleExportExcel = () => {
    ExcelService.exportLembagaToExcel();
    onShowToast('success', 'Data seluruh lembaga berhasil diekspor ke format Excel.');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Pangkalan Data Lembaga & Satuan Pendidikan
            </h2>
            <p className="text-xs text-slate-500">
              Total {lembagaList.length} lembaga kontingen terdaftar di sistem PORSENI.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAddLembagaModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Lembaga Baru</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama sekolah, NPSN, atau kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Status Lembaga</option>
              <option value="AKTIF">AKTIF (Disetujui)</option>
              <option value="MENUNGGU VERIFIKASI">MENUNGGU VERIFIKASI</option>
              <option value="PERLU PERBAIKAN">PERLU PERBAIKAN</option>
              <option value="DITOLAK">DITOLAK</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>

          <div>
            <select
              value={filterJenjang}
              onChange={e => setFilterJenjang(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Jenjang</option>
              <option value="MI/SD">MI / SD</option>
              <option value="MTs/SMP">MTs / SMP</option>
              <option value="MA/SMA/SMK">MA / SMA / SMK</option>
              <option value="PERGURUAN TINGGI">Perguruan Tinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Kode & Nama Lembaga</th>
                <th className="px-4 py-3">NPSN / Jenjang</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-center">Peserta</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l, idx) => {
                const count = pesertaList.filter(p => p.lembagaId === l.id).length;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{l.nama}</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                        {l.id} ({l.kodeLembaga})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 font-semibold">{l.npsn}</span>
                      <span className="text-[10px] text-slate-500 block">{l.jenjang}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 block">{l.kabupatenKota}</span>
                      <span className="text-[10px] text-slate-500">{l.provinsi}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 block">{l.operatorNama}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        user: {l.username} · {l.operatorHp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold font-mono text-xs bg-slate-100 text-slate-800">
                        {count} Siswa
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <LembagaStatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Lihat Detail Profil Lembaga"
                          onClick={() => setSelectedLembaga(l)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve */}
                        {l.status !== 'AKTIF' && (
                          <button
                            title="Setujui Lembaga"
                            onClick={() =>
                              setStatusModal({
                                isOpen: true,
                                lembaga: l,
                                targetStatus: 'AKTIF',
                                reason: 'Berkas SK mandat dan identitas sekolah terverifikasi sah.',
                              })
                            }
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Request repair */}
                        <button
                          title="Minta Perbaikan Dokumen"
                          onClick={() =>
                            setStatusModal({
                              isOpen: true,
                              lembaga: l,
                              targetStatus: 'PERLU PERBAIKAN',
                              reason: '',
                            })
                          }
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>

                        {/* Reset password */}
                        <button
                          title="Reset Password Operator"
                          onClick={() =>
                            setResetPwModal({
                              isOpen: true,
                              lembaga: l,
                              newPw: 'password123',
                            })
                          }
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-md"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DETAIL MODAL LEMBAGA --- */}
      {selectedLembaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div>
                <h3 className="text-sm font-bold">{selectedLembaga.nama}</h3>
                <p className="text-xs text-emerald-200">
                  {selectedLembaga.id} · NPSN: {selectedLembaga.npsn}
                </p>
              </div>
              <button onClick={() => setSelectedLembaga(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Pimpinan</span>
                  <span className="font-bold text-slate-900 text-sm block">{selectedLembaga.pimpinanNama}</span>
                  <span className="text-slate-600 block">NIP: {selectedLembaga.pimpinanNip || '-'}</span>
                  <span className="text-slate-600 block">WA: {selectedLembaga.pimpinanHp}</span>
                  <span className="text-slate-600 block">Email: {selectedLembaga.pimpinanEmail}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Operator Sekolah</span>
                  <span className="font-bold text-slate-900 text-sm block">{selectedLembaga.operatorNama}</span>
                  <span className="text-slate-600 block">NIK: {selectedLembaga.operatorNik}</span>
                  <span className="text-slate-600 block">Username: <strong className="font-mono">{selectedLembaga.username}</strong></span>
                  <span className="text-slate-600 block">WA: {selectedLembaga.operatorHp}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Alamat Lembaga</span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedLembaga.alamat}, {selectedLembaga.desaKelurahan}, {selectedLembaga.kecamatan}, {selectedLembaga.kabupatenKota}, {selectedLembaga.provinsi} ({selectedLembaga.kodePos})
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-2">Berkas Mandat Lembaga</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold block">Surat Mandat / Rekomendasi</span>
                    <span className="text-slate-500 text-[11px]">{selectedLembaga.suratMandatNama || 'Tersedia'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold block">Izin Operasional Lembaga</span>
                    <span className="text-slate-500 text-[11px]">{selectedLembaga.identitasLembagaNama || 'Tersedia'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedLembaga(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">
              Konfirmasi Perubahan Status: {statusModal.targetStatus}
            </h3>
            <p className="text-xs text-slate-600">
              Lembaga: <strong>{statusModal.lembaga?.nama}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Verifikasi Panitia
              </label>
              <textarea
                rows={3}
                value={statusModal.reason}
                onChange={e => setStatusModal({ ...statusModal, reason: e.target.value })}
                placeholder="Catatan..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyStatus}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Terapkan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-sm w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Reset Kata Sandi Operator</span>
            </h3>
            <p className="text-xs text-slate-600">
              Lembaga: <strong>{resetPwModal.lembaga?.nama}</strong> (user:{' '}
              {resetPwModal.lembaga?.username})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi Baru Sementara
              </label>
              <input
                type="text"
                required
                value={resetPwModal.newPw}
                onChange={e => setResetPwModal({ ...resetPwModal, newPw: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Berikan kata sandi ini kepada operator yang bersangkutan.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetPwModal({ ...resetPwModal, isOpen: false })}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetOperatorPassword}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Simpan Kata Sandi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Pendaftaran Awal Lembaga oleh Admin (6 fields only) */}
      {showAddLembagaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold">Formulir Pendaftaran Lembaga</h3>
                  <p className="text-[11px] text-emerald-200">
                    Oleh Panitia / Administrator Sistem PORSENI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddLembagaModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterLembaga} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <p className="font-bold">Ketentuan Akun Lembaga:</p>
                <p className="text-[11px] leading-relaxed">
                  Lembaga akan login menggunakan <strong>Email Lembaga</strong> yang didaftarkan dengan kata sandi bawaan (default) <span className="font-mono font-bold text-emerald-800">123456</span>. Sisa kelengkapan data (pimpinan, operator, alamat lengkap, dan surat mandat) dilengkapi oleh lembaga melalui akses login masing-masing.
                </p>
              </div>

              {/* NPSN */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLembaga.npsn}
                  onChange={e => setFormLembaga({ ...formLembaga, npsn: e.target.value })}
                  placeholder="Contoh: 20580045"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* NSM */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NSM (Nomor Statistik Madrasah / Sekolah) <span className="text-slate-400 font-normal">(Bila ada)</span>
                </label>
                <input
                  type="text"
                  value={formLembaga.nsm}
                  onChange={e => setFormLembaga({ ...formLembaga, nsm: e.target.value })}
                  placeholder="Contoh: 131135730001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* NAMA LEMBAGA */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NAMA LEMBAGA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLembaga.nama}
                  onChange={e => setFormLembaga({ ...formLembaga, nama: e.target.value })}
                  placeholder="Contoh: MAN 1 Kota Malang / SMA Negeri 3 Surabaya"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* JENJANG & STATUS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    JENJANG <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formLembaga.jenjang}
                    onChange={e => setFormLembaga({ ...formLembaga, jenjang: e.target.value as JenjangLembaga })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-medium"
                  >
                    <option value="MA/SMA/SMK">SMA / MA / SMK</option>
                    <option value="MTs/SMP">SMP / MTs</option>
                    <option value="MI/SD">SD / MI</option>
                    <option value="PERGURUAN TINGGI">Perguruan Tinggi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    STATUS LEMBAGA <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formLembaga.statusLembaga}
                    onChange={e => setFormLembaga({ ...formLembaga, statusLembaga: e.target.value as 'NEGERI' | 'SWASTA' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-medium"
                  >
                    <option value="NEGERI">Negeri</option>
                    <option value="SWASTA">Swasta</option>
                  </select>
                </div>
              </div>

              {/* EMAIL LEMBAGA */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  EMAIL LEMBAGA (Akun Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formLembaga.emailLembaga}
                  onChange={e => setFormLembaga({ ...formLembaga, emailLembaga: e.target.value })}
                  placeholder="Contoh: info@sekolah.sch.id / operator@sekolah.sch.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Password bawaan sistem: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-bold">123456</code> (dapat diganti oleh lembaga setelah login).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddLembagaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Lembaga & Terbitkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
