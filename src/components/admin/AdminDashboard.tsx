import React from 'react';
import { CabangLomba, Lembaga, PengaturanSistem, Peserta } from '../../types';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

interface AdminDashboardProps {
  lembagaList: Lembaga[];
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  pengaturan: PengaturanSistem;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lembagaList,
  pesertaList,
  cabangList,
  pengaturan,
  onNavigate,
}) => {
  // Lembaga stats
  const totalLembaga = lembagaList.length;
  const verifiedLembaga = lembagaList.filter(l => l.status === 'AKTIF').length;
  const pendingLembaga = lembagaList.filter(l => l.status === 'MENUNGGU VERIFIKASI').length;

  // Peserta stats
  const totalPeserta = pesertaList.length;
  const verifiedPeserta = pesertaList.filter(p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL').length;
  const pendingPeserta = pesertaList.filter(p => p.status === 'MENUNGGU VERIFIKASI').length;
  const rejectedPeserta = pesertaList.filter(p => p.status === 'DITOLAK' || p.status === 'PERLU PERBAIKAN').length;

  // Gender breakdown
  const maleCount = pesertaList.filter(p => p.jenisKelamin === 'L').length;
  const femaleCount = pesertaList.filter(p => p.jenisKelamin === 'P').length;

  // Category breakdown
  const olahragaCount = pesertaList.filter(p => p.kategoriLomba === 'OLAHRAGA').length;
  const seniCount = pesertaList.filter(p => p.kategoriLomba === 'SENI').length;

  // Branch popularities
  const branchCounts = cabangList.map(c => {
    const count = pesertaList.filter(p => p.cabangId === c.id).length;
    return { name: c.nama, count, quota: c.kuotaMaks, kategori: c.kategori };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* 1. Official Banner & Active Period */}
      <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-md border-b-4 border-amber-400">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-[11px] font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pusat Kendali Panitia Pelaksana</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">
              {pengaturan.namaPorseni} {pengaturan.tahun}
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              {pengaturan.namaPenyelenggara} · Seluruh data pendaftaran terenkripsi dan divalidasi terpusat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('verifikasi-peserta')}
              className="px-4 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-emerald-950" />
              <span>Verifikasi Peserta ({pendingPeserta})</span>
            </button>
            <button
              onClick={() => onNavigate('verifikasi-lembaga')}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>Verifikasi Lembaga ({pendingLembaga})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Metrics Grid with Attractive Colored Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-white p-3.5 rounded-2xl border-2 border-blue-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-blue-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-blue-900 font-bold block uppercase mt-1">Total Lembaga</span>
          <span className="text-xl font-extrabold text-blue-950 font-mono">{totalLembaga}</span>
          <span className="text-[9px] text-blue-700/80 block mt-0.5 font-medium">Kontingen Masuk</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-3.5 rounded-2xl border-2 border-emerald-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-emerald-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-emerald-900 font-bold block uppercase mt-1">Lembaga Aktif</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono">{verifiedLembaga}</span>
          <span className="text-[9px] text-emerald-700/80 block mt-0.5 font-medium">Disahkan</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white p-3.5 rounded-2xl border-2 border-amber-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-amber-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-amber-900 font-bold block uppercase mt-1">Lembaga Pending</span>
          <span className="text-xl font-extrabold text-amber-600 font-mono">{pendingLembaga}</span>
          <span className="text-[9px] text-amber-700/80 block mt-0.5 font-medium">Perlu Review</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white p-3.5 rounded-2xl border-2 border-indigo-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-indigo-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-indigo-900 font-bold block uppercase mt-1">Total Atlet/Seniman</span>
          <span className="text-xl font-extrabold text-indigo-950 font-mono">{totalPeserta}</span>
          <span className="text-[9px] text-indigo-700/80 block mt-0.5 font-medium">Peserta Terdaftar</span>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-white p-3.5 rounded-2xl border-2 border-teal-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-teal-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-teal-900 font-bold block uppercase mt-1">Peserta Sah</span>
          <span className="text-xl font-extrabold text-teal-700 font-mono">{verifiedPeserta}</span>
          <span className="text-[9px] text-teal-700/80 block mt-0.5 font-medium">Terverifikasi</span>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white p-3.5 rounded-2xl border-2 border-purple-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-purple-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-purple-900 font-bold block uppercase mt-1">Menunggu Review</span>
          <span className="text-xl font-extrabold text-purple-700 font-mono">{pendingPeserta}</span>
          <span className="text-[9px] text-purple-700/80 block mt-0.5 font-medium">Antrean Berkas</span>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white p-3.5 rounded-2xl border-2 border-rose-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-rose-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-rose-900 font-bold block uppercase mt-1">Perbaikan / Tolak</span>
          <span className="text-xl font-extrabold text-rose-600 font-mono">{rejectedPeserta}</span>
          <span className="text-[9px] text-rose-700/80 block mt-0.5 font-medium">Perlu Tindakan</span>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-white p-3.5 rounded-2xl border-2 border-cyan-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="h-1.5 w-full bg-cyan-500 absolute top-0 left-0"></div>
          <span className="text-[10px] text-cyan-900 font-bold block uppercase mt-1">Cabang Lomba</span>
          <span className="text-xl font-extrabold text-cyan-800 font-mono">{cabangList.length}</span>
          <span className="text-[9px] text-cyan-700/80 block mt-0.5 font-medium">Nomor Tanding</span>
        </div>
      </div>

      {/* 3. Charts & Analytics Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Branch Participation Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Statistik Peserta per Cabang Lomba
              </h3>
              <p className="text-[11px] text-slate-500">
                Peringkat cabang lomba dengan jumlah kontingen terbanyak.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cabang')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Lihat Master Cabang
            </button>
          </div>

          <div className="space-y-3">
            {branchCounts.slice(0, 6).map((b, i) => {
              const percentage = totalPeserta > 0 ? Math.round((b.count / totalPeserta) * 100) : 0;
              return (
                <div key={i} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">{b.name}</span>
                    <span className="font-mono text-slate-600">
                      <strong>{b.count}</strong> peserta ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.kategori === 'OLAHRAGA' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Demographics & Gender Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {/* Gender Split */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
              Komposisi Gender Peserta
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">
                  Putra (Laki-Laki)
                </span>
                <span className="text-xl font-extrabold text-blue-900 font-mono">{maleCount}</span>
                <span className="text-[10px] text-blue-600 block">
                  {totalPeserta > 0 ? Math.round((maleCount / totalPeserta) * 100) : 0}%
                </span>
              </div>

              <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg text-center">
                <span className="text-[10px] font-bold text-pink-700 block uppercase">
                  Putri (Perempuan)
                </span>
                <span className="text-xl font-extrabold text-pink-900 font-mono">{femaleCount}</span>
                <span className="text-[10px] text-pink-600 block">
                  {totalPeserta > 0 ? Math.round((femaleCount / totalPeserta) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Split Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${totalPeserta > 0 ? (maleCount / totalPeserta) * 100 : 50}%` }}
              ></div>
              <div
                className="bg-pink-500 h-full"
                style={{ width: `${totalPeserta > 0 ? (femaleCount / totalPeserta) * 100 : 50}%` }}
              ></div>
            </div>
          </div>

          {/* Kategori Split (Olahraga vs Seni) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
              Kategori Lomba
            </h3>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-emerald-800">Olahraga: {olahragaCount} atlet</span>
              <span className="font-semibold text-amber-800">Seni: {seniCount} seniman</span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${totalPeserta > 0 ? (olahragaCount / totalPeserta) * 100 : 50}%` }}
              ></div>
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${totalPeserta > 0 ? (seniCount / totalPeserta) * 100 : 50}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
