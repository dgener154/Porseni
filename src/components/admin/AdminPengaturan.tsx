import React, { useState } from 'react';
import { PengaturanSistem, Periode } from '../../types';
import { StorageService } from '../../services/storage';
import { PorseniEmblem } from '../common/OfficialLogos';
import { uploadAllToFirestore, downloadAllFromFirestore } from '../../services/firebase';
import { SpreadsheetSyncService } from '../../services/spreadsheetSync';
import {
  Settings,
  Calendar,
  Save,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Phone,
  Mail,
  Globe,
  Plus,
  Upload,
  Image as ImageIcon,
  Trash2,
  Cloud,
  Database,
  RefreshCw,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
} from 'lucide-react';

interface AdminPengaturanProps {
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminPengaturan: React.FC<AdminPengaturanProps> = ({
  onRefresh,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<PengaturanSistem>(StorageService.getPengaturan());
  const [periodeList, setPeriodeList] = useState<Periode[]>(StorageService.getPeriode());
  const [loading, setLoading] = useState(false);

  // New period input modal
  const [showAddPeriode, setShowAddPeriode] = useState(false);
  const [newPeriode, setNewPeriode] = useState({
    tahun: '2027',
    nama: 'PORSENI Tingkat Nasional 2027',
    tema: 'Membangun Karakter Juara Berakhlak Mulia',
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      StorageService.savePengaturan(settings);
      StorageService.addAuditLog({
        user: 'admin',
        role: 'ADMIN',
        aktivitas: 'Perbarui Pengaturan Sistem',
        rincian: `Memperbarui identitas PORSENI ${settings.namaPorseni} tahun ${settings.tahun}`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', 'Konfigurasi identitas dan sistem PORSENI berhasil disimpan.');
      onRefresh();
    } catch {
      onShowToast('error', 'Gagal menyimpan pengaturan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      onShowToast('error', 'Ukuran file logo terlalu besar. Maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
        onShowToast(
          'success',
          'Logo PORSENI baru berhasil dimuat! Klik "Simpan Seluruh Pengaturan" untuk menerapkan ke seluruh sistem.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: undefined }));
    onShowToast(
      'info',
      'Logo dikembalikan ke logo bawaan sistem. Klik "Simpan Seluruh Pengaturan" untuk menerapkan.'
    );
  };

  const handleCreatePeriode = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `PRD-${newPeriode.tahun}`;
    const p: Periode = {
      id,
      tahun: newPeriode.tahun,
      nama: newPeriode.nama,
      tema: newPeriode.tema,
      status: 'AKTIF',
    };
    StorageService.savePeriode(p);
    setPeriodeList(StorageService.getPeriode());
    setSettings(prev => ({ ...prev, aktifPeriodeId: id, tahun: newPeriode.tahun }));
    setShowAddPeriode(false);
    onShowToast('success', `Periode baru ${newPeriode.nama} berhasil diaktifkan!`);
  };

  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);

  const handleSyncPushCloud = async () => {
    setSyncingCloud(true);
    const res = await uploadAllToFirestore();
    setSyncingCloud(false);
    if (res.success) {
      onShowToast('success', `${res.message} (${res.counts.peserta} peserta, ${res.counts.lembaga} lembaga)`);
      setSettings(StorageService.getPengaturan());
      onRefresh();
    } else {
      onShowToast('error', res.message);
    }
  };

  const handleSyncPullCloud = async () => {
    setSyncingCloud(true);
    const res = await downloadAllFromFirestore();
    setSyncingCloud(false);
    if (res.success) {
      onShowToast('success', `${res.message} (${res.counts.peserta} peserta, ${res.counts.lembaga} lembaga)`);
      setSettings(StorageService.getPengaturan());
      onRefresh();
    } else {
      onShowToast('error', res.message);
    }
  };

  const handlePullSpreadsheet = async () => {
    if (!settings.spreadsheetId) {
      onShowToast('warning', 'Silakan masukkan ID Google Spreadsheet terlebih dahulu.');
      return;
    }
    setSyncingSheet(true);
    const res = await SpreadsheetSyncService.pullFromSpreadsheet(settings.spreadsheetId);
    setSyncingSheet(false);
    if (res.success) {
      onShowToast('success', res.message);
      setSettings(StorageService.getPengaturan());
      onRefresh();
    } else {
      onShowToast('error', res.message);
    }
  };

  const handleDownloadTemplate = () => {
    SpreadsheetSyncService.downloadTemplateSpreadsheet();
    onShowToast(
      'success',
      'Format template Google Spreadsheet (.xlsx) berhasil diunduh. Upload ke Google Drive untuk mulai sinkronisasi.'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Multi-Period Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pengaturan Periode PORSENI Aktif
              </h2>
              <p className="text-xs text-slate-500">
                Pilih periode aktif atau buat tahun ajaran / pelaksanaan baru.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={settings.aktifPeriodeId}
              onChange={e => {
                const found = periodeList.find(p => p.id === e.target.value);
                setSettings(prev => ({
                  ...prev,
                  aktifPeriodeId: e.target.value,
                  tahun: found?.tahun || prev.tahun,
                }));
              }}
              className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-lg font-mono"
            >
              {periodeList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddPeriode(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Periode Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Identity & System Configurations Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-200">
          <Settings className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Identitas Resmi Kegiatan & Pengaturan Portal
            </h3>
            <p className="text-xs text-slate-500">
              Pengaturan ini akan otomatis berlaku pada seluruh kop surat, kartu peserta, dan halaman publik.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          {/* Section A: Identitas */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide">
              A. Identitas Penyelenggaraan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Porseni Upload Section */}
              <div className="sm:col-span-2 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      <label className="font-bold text-slate-800 text-xs">
                        Logo Resmi PORSENI (Tidak Permanen & Dapat Diubah)
                      </label>
                      {settings.logoUrl ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Logo Kustom Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Logo Bawaan Standar
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Upload logo resmi instansi, kepanitiaan, atau lambang daerah Anda (PNG, JPG, SVG, WebP). Logo ini otomatis berlaku di seluruh aplikasi: Header Navbar, Hero Banner bergerak, Modal Login, Bukti Pendaftaran, dan Cetak Kartu Peserta Resmi.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{settings.logoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Kembalikan ke logo resmi bawaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset ke Bawaan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Logo Preview Box */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-600">Pratinjau Logo Aktif:</span>
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <PorseniEmblem size={52} logoUrl={settings.logoUrl} className="shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-800 text-xs">
                        {settings.namaWebsite || 'PORSENI DIGITAL'}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {settings.tingkatWilayah || 'Portal Resmi'} · {settings.tahun}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    *Maksimal ukuran file 3 MB. Disarankan rasio 1:1 dengan latar belakang transparan.
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Website / Aplikasi Portal
                </label>
                <input
                  type="text"
                  required
                  value={settings.namaWebsite || ''}
                  onChange={e => setSettings({ ...settings, namaWebsite: e.target.value })}
                  placeholder="Contoh: PORSENI DIGITAL / SISTEM INFORMASI PORSENI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-extrabold text-emerald-950"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Nama ini dapat disesuaikan bebas lewat pengaturan (fleksibel untuk segala instansi, kementerian, kabupaten/kota, atau provinsi).
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Resmi Kegiatan PORSENI (Dapat disesuaikan tiap tahunnya)
                </label>
                <input
                  type="text"
                  required
                  value={settings.namaPorseni}
                  onChange={e => setSettings({ ...settings, namaPorseni: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tahun Pelaksanaan
                </label>
                <input
                  type="text"
                  required
                  value={settings.tahun}
                  onChange={e => setSettings({ ...settings, tahun: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Wilayah / Cakupan
                </label>
                <input
                  type="text"
                  value={settings.tingkatWilayah || ''}
                  onChange={e => setSettings({ ...settings, tingkatWilayah: e.target.value })}
                  placeholder="Contoh: Tingkat Kabupaten / Provinsi / Nasional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Instansi / Penyelenggara Resmi
                </label>
                <input
                  type="text"
                  required
                  value={settings.namaPenyelenggara}
                  onChange={e => setSettings({ ...settings, namaPenyelenggara: e.target.value })}
                  placeholder="Contoh: Panitia Pelaksana PORSENI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Tema Resmi PORSENI
                </label>
                <input
                  type="text"
                  required
                  value={settings.tema}
                  onChange={e => setSettings({ ...settings, tema: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg italic"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Sekretariat Panitia
                </label>
                <input
                  type="text"
                  required
                  value={settings.alamat}
                  onChange={e => setSettings({ ...settings, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Kontak Panitia
                </label>
                <input
                  type="email"
                  required
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Telepon / Hotline
                </label>
                <input
                  type="text"
                  required
                  value={settings.telepon}
                  onChange={e => setSettings({ ...settings, telepon: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section B: Status Pendaftaran & Maintenance */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide">
              B. Status Portal & Pendaftaran
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Penerimaan Peserta (Online)</span>
                  <span className="text-[11px] text-slate-500">
                    {settings.statusPendaftaran ? 'Lembaga dapat mendaftarkan peserta baru' : 'Pendaftaran dikunci / ditutup'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.statusPendaftaran}
                  onChange={e => setSettings({ ...settings, statusPendaftaran: e.target.checked })}
                  className="w-5 h-5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Mode Pemeliharaan (Maintenance)</span>
                  <span className="text-[11px] text-slate-500">Kunci portal untuk pembaruan sistem</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.statusMaintenance}
                  onChange={e => setSettings({ ...settings, statusMaintenance: e.target.checked })}
                  className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section C: Integrasi Google Spreadsheet & Cloud Multi-Device */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                  C. Integrasi Google Spreadsheet & Cloud Multi-Device (Opsi C)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 self-start sm:self-auto">
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>Cloud Sync & Spreadsheet Aktif</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dengan integrasi ini, Anda cukup memasukkan <strong>ID Google Spreadsheet</strong> di perangkat apa pun. Aplikasi otomatis menarik data dari spreadsheet tersebut, serta menyinkronkan seluruh perubahan ke database cloud sehingga semua device (laptop/HP panitia) selalu menampilkan data yang persis sama.
            </p>

            {/* Box 1: Google Spreadsheet ID Input & Actions */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>ID Google Spreadsheet</span>
                </label>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Format Master Sheet (.xlsx)</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={settings.spreadsheetId || ''}
                  onChange={e => setSettings({ ...settings, spreadsheetId: e.target.value })}
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau tempel link spreadsheet"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handlePullSpreadsheet}
                  disabled={syncingSheet || !settings.spreadsheetId}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSheet ? 'animate-spin' : ''}`} />
                  <span>{syncingSheet ? 'Menyinkronkan...' : 'Tarik Data dari Spreadsheet'}</span>
                </button>
              </div>

              {settings.lastSyncSpreadsheet && (
                <p className="text-[10px] text-emerald-800 font-medium">
                  Terakhir disinkronkan dengan Google Spreadsheet: <span className="font-mono">{new Date(settings.lastSyncSpreadsheet).toLocaleString('id-ID')}</span>
                </p>
              )}

              {/* Panduan Ringkas */}
              <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-emerald-900">Petunjuk Penggunaan Spreadsheet:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                  <li>Buat atau buka Google Spreadsheet Anda yang berisi tab <code className="bg-slate-100 px-1 rounded font-bold text-emerald-800">Peserta</code> dan <code className="bg-slate-100 px-1 rounded font-bold text-emerald-800">Lembaga</code> (atau gunakan tombol <em>Unduh Format Master Sheet</em> di atas).</li>
                  <li>Atur akses berbagi di Google Sheets: <strong>Bagikan / Share &gt; Siapa saja yang memiliki link dapat melihat</strong> (Viewer).</li>
                  <li>Salin ID dari URL Google Sheets (teks antara <code className="bg-slate-100 px-1 rounded">/d/</code> dan <code className="bg-slate-100 px-1 rounded">/edit</code>) lalu tempel ke kolom di atas.</li>
                  <li>Klik <strong>Tarik Data dari Spreadsheet</strong>. Data akan otomatis masuk ke sistem dan tersinkronkan ke seluruh perangkat!</li>
                </ol>
              </div>
            </div>

            {/* Box 2: Cloud Database Sync Status (Multi-Device) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-900 text-xs">Pangkalan Data Cloud Multi-Device (Firebase Firestore)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                  Online & Terhubung
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Pangkalan data cloud memastikan ketika satu panitia memverifikasi peserta atau menambahkan lembaga, seluruh laptop dan HP panitia lainnya langsung sinkron secara otomatis.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncPushCloud}
                  disabled={syncingCloud}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUpFromLine className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                  <span>{syncingCloud ? 'Mengunggah...' : 'Kirim Data Lokal ke Cloud (Push)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncPullCloud}
                  disabled={syncingCloud}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                  <span>{syncingCloud ? 'Mengunduh...' : 'Tarik Data Cloud ke Device Ini (Pull)'}</span>
                </button>
              </div>

              {settings.lastSyncCloud && (
                <p className="text-[10px] text-slate-500 font-medium pt-1">
                  Sinkronisasi Cloud terakhir: <span className="font-mono">{new Date(settings.lastSyncCloud).toLocaleString('id-ID')}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Add Periode */}
      {showAddPeriode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">Buat Periode PORSENI Baru</h3>
            <form onSubmit={handleCreatePeriode} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                <input
                  type="text"
                  required
                  value={newPeriode.tahun}
                  onChange={e => setNewPeriode({ ...newPeriode, tahun: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Periode</label>
                <input
                  type="text"
                  required
                  value={newPeriode.nama}
                  onChange={e => setNewPeriode({ ...newPeriode, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tema Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newPeriode.tema}
                  onChange={e => setNewPeriode({ ...newPeriode, tema: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPeriode(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Buat & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
