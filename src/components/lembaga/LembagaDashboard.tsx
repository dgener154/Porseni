import React from 'react';
import { Lembaga, Peserta, CabangLomba, PengaturanSistem } from '../../types';
import { LembagaStatusBadge } from '../common/UIComponents';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  FileText,
  AlertTriangle,
  ArrowRight,
  Printer,
  Upload,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

interface LembagaDashboardProps {
  lembaga: Lembaga;
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  pengaturan: PengaturanSistem;
  onNavigate: (tab: string) => void;
}

export const LembagaDashboard: React.FC<LembagaDashboardProps> = ({
  lembaga,
  pesertaList,
  cabangList,
  pengaturan,
  onNavigate,
}) => {
  const totalPeserta = pesertaList.length;
  const verifiedPeserta = pesertaList.filter(p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL').length;
  const pendingPeserta = pesertaList.filter(p => p.status === 'MENUNGGU VERIFIKASI').length;
  const rejectedPeserta = pesertaList.filter(p => p.status === 'DITOLAK' || p.status === 'PERLU PERBAIKAN').length;

  // Unique branches entered
  const enteredBranches = new Set(pesertaList.map(p => p.cabangId)).size;

  // Document completeness count
  let incompleteDocsPeserta = 0;
  pesertaList.forEach(p => {
    const hasIncomplete = p.dokumenList.some(d => !d.namaFile || d.status === 'TIDAK VALID');
    if (hasIncomplete) incompleteDocsPeserta++;
  });

  const isLembagaVerified = lembaga.status === 'AKTIF';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Verification Warning */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-500 font-mono">
                {lembaga.id} · NPSN: {lembaga.npsn}
              </span>
              <LembagaStatusBadge status={lembaga.status} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">{lembaga.nama}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operator: <strong className="text-slate-700">{lembaga.operatorNama}</strong> ({lembaga.operatorEmail}) · Jenjang: {lembaga.jenjang}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('peserta')}
              disabled={!isLembagaVerified}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Daftarkan Peserta</span>
            </button>
            <button
              onClick={() => onNavigate('kartu')}
              className="px-4 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak Kartu ({verifiedPeserta})</span>
            </button>
          </div>
        </div>

        {!isLembagaVerified && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block">Status Lembaga: {lembaga.status}</span>
              <span>
                Akun lembaga Anda saat ini sedang dalam proses verifikasi dokumen oleh panitia pusat.
                Pendaftaran peserta lomba baru dapat dilakukan setelah status akun disetujui (AKTIF).
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Visual Registration Progress Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Tahapan Progres Pendaftaran PORSENI
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
          {[
            { step: '1. Daftar Lembaga', done: true },
            { step: '2. Verifikasi Lembaga', done: isLembagaVerified },
            { step: '3. Input Peserta', done: totalPeserta > 0 },
            { step: '4. Upload Berkas', done: totalPeserta > 0 && incompleteDocsPeserta === 0 },
            { step: '5. Verifikasi Peserta', done: verifiedPeserta > 0 },
            { step: '6. Peserta Final', done: verifiedPeserta > 0 },
            { step: '7. Cetak Kartu', done: verifiedPeserta > 0 },
            { step: '8. Lomba PORSENI', done: false },
          ].map((item, index) => (
            <div
              key={index}
              className={`p-2.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                item.done
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] mb-1 font-bold ${
                  item.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {item.done ? '✓' : index + 1}
              </div>
              <span className="line-clamp-1">{item.step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Statistical Metrics Grid with Attractive Colored Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border-2 border-blue-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-blue-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-blue-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Total Atlet/Seniman</span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <span className="text-2xl font-extrabold text-blue-950 font-mono">
            {totalPeserta}
          </span>
          <span className="text-[10px] text-blue-700/80 block mt-1 font-medium">Siswa Terdaftar</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border-2 border-emerald-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-emerald-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-emerald-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Terverifikasi Sah</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">
            {verifiedPeserta}
          </span>
          <span className="text-[10px] text-emerald-700/80 block mt-1 font-medium">Siap Cetak Kartu</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border-2 border-amber-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-amber-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-amber-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Menunggu Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600 font-mono">
            {pendingPeserta}
          </span>
          <span className="text-[10px] text-amber-700/80 block mt-1 font-medium">Proses Pemeriksaan</span>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-4 border-2 border-rose-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-rose-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-rose-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Perlu Perbaikan</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-rose-600 font-mono">
            {rejectedPeserta}
          </span>
          <span className="text-[10px] text-rose-700/80 block mt-1 font-medium">Cek Catatan Panitia</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-4 border-2 border-indigo-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-indigo-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-indigo-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Cabang Diikuti</span>
            <Trophy className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-extrabold text-indigo-950 font-mono">
            {enteredBranches}
          </span>
          <span className="text-[10px] text-indigo-700/80 block mt-1 font-medium">
            Dari {cabangList.length} Cabang
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 border-2 border-purple-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-purple-500 absolute top-0 left-0"></div>
          <div className="flex items-center justify-between text-purple-900 mb-1 mt-1">
            <span className="text-[11px] font-bold uppercase">Belum Lengkap</span>
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-purple-700 font-mono">
            {incompleteDocsPeserta}
          </span>
          <span className="text-[10px] text-purple-700/80 block mt-1 font-medium">Wajib Dilengkapi</span>
        </div>
      </div>

      {/* 4. Two-Column Information (Urgent Notice & Schedule) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Urgent Notices */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Batas Waktu & Jadwal Krusial
              </h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Batas Akhir Pendaftaran Peserta</span>
                  <span className="text-[11px] text-slate-500">15 September 2026 pukul 23.59 WIB</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                  Aktif
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Technical Meeting & Undian</span>
                  <span className="text-[11px] text-slate-500">22 September 2026 (Auditorium Pusat)</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded text-[10px]">
                  Akan Datang
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Petunjuk teknis lomba dapat diunduh di menu Panduan.</span>
            <button
              onClick={() => onNavigate('panduan')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Lihat Juknis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Aksi Cepat Kontingen
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => onNavigate('peserta')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-colors"
              >
                <Users className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="font-bold text-slate-900 block">Formulir Peserta</span>
                <span className="text-[10px] text-slate-500">Input manual satu per satu</span>
              </button>

              <button
                onClick={() => onNavigate('import')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-colors"
              >
                <Upload className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="font-bold text-slate-900 block">Import Data Excel</span>
                <span className="text-[10px] text-slate-500">Upload batch format .xlsx</span>
              </button>

              <button
                onClick={() => onNavigate('kartu')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-colors"
              >
                <Printer className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="font-bold text-slate-900 block">Cetak Kartu Tanda</span>
                <span className="text-[10px] text-slate-500">Khusus data terverifikasi</span>
              </button>

              <button
                onClick={() => onNavigate('rekap')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-colors"
              >
                <FileText className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="font-bold text-slate-900 block">Rekap & Ekspor</span>
                <span className="text-[10px] text-slate-500">Unduh data Excel resmi</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Pastikan seluruh berkas wajib diunggah sebelum verifikasi akhir oleh panitia.
          </div>
        </div>
      </div>
    </div>
  );
};
