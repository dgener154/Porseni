import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/UIComponents';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface AdminBackupProps {
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminBackup: React.FC<AdminBackupProps> = ({
  onRefresh,
  onShowToast,
}) => {
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const json = StorageService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_PORSENI_Digital_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    StorageService.addAuditLog({
      user: 'admin',
      role: 'ADMIN',
      aktivitas: 'Cadangan Sistem (Backup)',
      rincian: 'Mengunduh file snapshot basis data penuh PORSENI Digital.',
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    onShowToast('success', 'File cadangan basis data berhasil diunduh.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        setPendingRestoreJson(content);
        setRestoreConfirm(true);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmRestore = () => {
    if (!pendingRestoreJson) return;
    const res = StorageService.importFullBackup(pendingRestoreJson);
    setRestoreConfirm(false);
    setPendingRestoreJson(null);

    if (res.success) {
      onShowToast('success', res.message);
      onRefresh();
    } else {
      onShowToast('error', res.message);
    }
  };

  const handleConfirmReset = () => {
    StorageService.resetToFactoryDefaults();
    setResetConfirm(false);
    onShowToast('info', 'Sistem berhasil direset ke setelan awal default.');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Backup Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-extrabold text-slate-900">
              Cadangkan Seluruh Basis Data Sistem (Full Backup)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Unduh salinan arsip lengkap seluruh tabel data PORSENI, mencakup konfigurasi sistem, akun pengguna, data lembaga kontingen, data peserta atlet, master cabang lomba, jadwal, pengumuman, dan riwayat log audit dalam format file JSON terenkripsi.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.JSON)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-extrabold text-slate-900">
              Pemulihan Basis Data dari Cadangan (Restore)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Pulihkan basis data sistem dari berkas JSON cadangan yang telah dibuat sebelumnya.
              Perhatian: Proses pemulihan akan menimpa data yang sedang aktif saat ini dengan data yang ada di dalam berkas cadangan.
            </p>
            <div className="pt-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                <span>Pilih Berkas Cadangan untuk Dipulihkan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset */}
      <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-extrabold text-rose-900">
              Kembalikan ke Setelan Awal Pabrik (Factory Reset)
            </h3>
            <p className="text-xs text-rose-700/80 leading-relaxed max-w-2xl">
              Mengosongkan perubahan lokal dan memulihkan data demo awal resmi PORSENI 2026.
              Gunakan fungsi ini hanya bila Anda ingin memulai kembali simulasi dari nol.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setResetConfirm(true)}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Awal Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmModal
        isOpen={restoreConfirm}
        title="Konfirmasi Pemulihan Cadangan Data"
        message="Apakah Anda yakin ingin memulihkan sistem dari file cadangan ini? Seluruh data yang ada saat ini akan ditimpa dengan data di file cadangan."
        confirmLabel="Ya, Pulihkan Sekarang"
        confirmVariant="warning"
        onCancel={() => {
          setRestoreConfirm(false);
          setPendingRestoreJson(null);
        }}
        onConfirm={handleConfirmRestore}
      />

      <ConfirmModal
        isOpen={resetConfirm}
        title="Konfirmasi Reset ke Setelan Pabrik"
        message="Tindakan ini akan mengembalikan seluruh akun, cabang lomba, dan data peserta ke seed resmi default PORSENI. Apakah Anda ingin melanjutkan?"
        confirmLabel="Ya, Reset Sekarang"
        confirmVariant="danger"
        onCancel={() => setResetConfirm(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};
