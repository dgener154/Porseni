import React, { useState, useEffect } from 'react';
import { CodeGeneratorService } from '../../services/barcode';
import { uploadAllToFirestore, downloadAllFromFirestore, isCloudOnline } from '../../services/firebase';
import {
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  X,
  Share2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const MultiDeviceModal: React.FC<MultiDeviceModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<boolean>(true);

  // App URL: prefer shared link or current origin
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-pre-ovc2pdpjebsfggpxeihqfz-40570645994.asia-southeast1.run.app';

  useEffect(() => {
    if (isOpen) {
      CodeGeneratorService.generateQrCodeDataUrl(appUrl).then(url => {
        setQrCodeDataUrl(url);
      });
      setCloudStatus(isCloudOnline());
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    if (onShowToast) {
      onShowToast('success', 'Link aplikasi berhasil disalin ke clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleForcePush = async () => {
    try {
      setIsSyncing(true);
      if (onShowToast) onShowToast('info', 'Mengunggah dan menyinkronkan seluruh database lokal ke Cloud Firestore...');
      const result = await uploadAllToFirestore();
      if (result.success) {
        if (onShowToast) onShowToast('success', result.message);
        setCloudStatus(true);
      } else {
        if (onShowToast) onShowToast('error', result.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForcePull = async () => {
    try {
      setIsSyncing(true);
      if (onShowToast) onShowToast('info', 'Menarik data terbaru dari Cloud Firestore...');
      const result = await downloadAllFromFirestore();
      if (result.success) {
        if (onShowToast) onShowToast('success', result.message);
        setCloudStatus(true);
      } else {
        if (onShowToast) onShowToast('error', result.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-300 border border-emerald-800">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Panduan Akses Multi-Device & Cloud Real-Time
              </h3>
              <p className="text-xs text-emerald-200">
                PORSENI Digital Online · Otomatis Terhubung Antar HP, Tablet, & Laptop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Cloud Status Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-950">
                    Cloud Firestore Real-Time Aktif
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Setiap penambahan atau perubahan data langsung tersinkronkan ke seluruh perangkat yang sedang membuka website ini secara otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleForcePush}
                disabled={isSyncing}
                className="px-3 py-1.5 text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Unggah seluruh data lokal ke cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Unggah Cloud</span>
              </button>
              <button
                onClick={handleForcePull}
                disabled={isSyncing}
                className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Tarik data terbaru dari cloud"
              >
                <span>Tarik Data</span>
              </button>
            </div>
          </div>

          {/* QR Code & Direct Link Box */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* QR Code */}
            <div className="sm:col-span-4 flex flex-col items-center text-center">
              <div className="p-2 bg-white rounded-xl shadow-md border-2 border-emerald-700">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Akses Aplikasi di HP"
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-slate-100 text-slate-400">
                    <QrCode className="w-10 h-10 animate-pulse" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                Scan dengan Kamera HP
              </span>
            </div>

            {/* Direct Link & Description */}
            <div className="sm:col-span-8 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Link Akses Aplikasi Resmi (Semua Perangkat):
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Buka link ini di Google Chrome, Safari, atau browser perangkat apa pun:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-700 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  <Smartphone className="w-3.5 h-3.5" /> HP Android / iPhone
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  <Laptop className="w-3.5 h-3.5" /> Laptop / Komputer PC
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  <Layers className="w-3.5 h-3.5" /> Tablet / iPad
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Cara Menggunakan di Berbagai Perangkat & Kolaborasi Otomatis</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h5 className="text-xs font-bold text-slate-900">Buka di Perangkat Lain</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Buka link di browser HP Android, iPhone, tablet, atau laptop lain tanpa perlu instal software apa pun.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h5 className="text-xs font-bold text-slate-900">Login Sesuai Peran</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Panitia login sebagai <strong>Admin</strong> di laptop, sedangkan sekolah/madrasah login sebagai <strong>Lembaga</strong> di HP.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h5 className="text-xs font-bold text-slate-900">Update Real-Time</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Saat peserta didaftarkan atau diverifikasi di satu perangkat, data langsung terbarui otomatis di semua layar seketika!
                </p>
              </div>
            </div>
          </div>

          {/* PWA Tips: Install as Mobile App */}
          <div className="p-4 bg-emerald-900 text-white rounded-xl space-y-2 border-l-4 border-amber-400">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-300" />
              <h5 className="text-xs font-bold tracking-wide">
                Tips: Jadikan Aplikasi di Layar Utama HP (Install PWA)
              </h5>
            </div>
            <p className="text-[11px] text-emerald-100 leading-relaxed">
              Di browser HP (Google Chrome di Android atau Safari di iPhone), tekan menu titik tiga atau tombol Bagikan (Share) &rarr; pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>. Aplikasi PORSENI Digital akan muncul di menu HP seperti aplikasi dari Play Store tanpa batas kuota!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Firebase Database: ai-studio-porsenidigital
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
