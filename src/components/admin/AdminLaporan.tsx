import React, { useState } from 'react';
import { CabangLomba, Lembaga, Peserta } from '../../types';
import { ExcelService } from '../../services/excel';
import { PesertaStatusBadge } from '../common/UIComponents';
import {
  FileSpreadsheet,
  Printer,
  BarChart3,
  Users,
  Building,
  Trophy,
  Filter,
} from 'lucide-react';

interface AdminLaporanProps {
  pesertaList: Peserta[];
  lembagaList: Lembaga[];
  cabangList: CabangLomba[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminLaporan: React.FC<AdminLaporanProps> = ({
  pesertaList,
  lembagaList,
  cabangList,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'CABANG' | 'LEMBAGA' | 'GENDER' | 'STATUS'>('CABANG');
  const [filterCabang, setFilterCabang] = useState('');

  const handleExportAllPeserta = () => {
    ExcelService.exportPesertaToExcel(pesertaList, 'Laporan_Pusat_Peserta_PORSENI');
    onShowToast('success', `Berhasil mengekspor ${pesertaList.length} data peserta ke Excel.`);
  };

  const handleExportLembaga = () => {
    ExcelService.exportLembagaToExcel();
    onShowToast('success', 'Berhasil mengekspor rekap lembaga ke Excel.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Header (No Print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Pusat Pelaporan & Analitika Kegiatan PORSENI
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi partisipasi kontingen berdasarkan cabang tanding, wilayah, gender, dan status verifikasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllPeserta}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Semua Peserta (Excel)</span>
            </button>
            <button
              onClick={handleExportLembaga}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-900" />
              <span>Ekspor Lembaga</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('CABANG')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'CABANG' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Rekap per Cabang Lomba
          </button>
          <button
            onClick={() => setActiveTab('LEMBAGA')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'LEMBAGA' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Rekap per Lembaga Kontingen
          </button>
          <button
            onClick={() => setActiveTab('GENDER')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'GENDER' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Rekap Komposisi Gender
          </button>
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'STATUS' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Rekap Status Verifikasi
          </button>
        </div>
      </div>

      {/* Report Tables Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 print:border-none print:shadow-none print:p-0">
        <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
            LAPORAN RESMI REKAPITULASI PANITIA PELAKSANA PORSENI NASIONAL
          </h2>
          <p className="text-[11px] text-slate-600">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Tab 1: Rekap per Cabang */}
        {activeTab === 'CABANG' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                  <th className="p-2 border border-slate-300 text-center w-8">No</th>
                  <th className="p-2 border border-slate-300">Kode</th>
                  <th className="p-2 border border-slate-300">Nama Cabang Lomba</th>
                  <th className="p-2 border border-slate-300">Kategori</th>
                  <th className="p-2 border border-slate-300 text-center">Putra (L)</th>
                  <th className="p-2 border border-slate-300 text-center">Putri (P)</th>
                  <th className="p-2 border border-slate-300 text-center">Total Peserta</th>
                  <th className="p-2 border border-slate-300 text-center">Status Berkas Sah</th>
                </tr>
              </thead>
              <tbody>
                {cabangList.map((c, i) => {
                  const participants = pesertaList.filter(p => p.cabangId === c.id);
                  const paCount = participants.filter(p => p.jenisKelamin === 'L').length;
                  const piCount = participants.filter(p => p.jenisKelamin === 'P').length;
                  const verified = participants.filter(p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL').length;

                  return (
                    <tr key={c.id} className="border border-slate-300 hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{i + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-emerald-900">{c.kode}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{c.nama}</td>
                      <td className="p-2 border border-slate-300">{c.kategori} ({c.jenis})</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{paCount}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{piCount}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{participants.length}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-emerald-700 font-bold">{verified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Rekap per Lembaga */}
        {activeTab === 'LEMBAGA' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                  <th className="p-2 border border-slate-300 text-center w-8">No</th>
                  <th className="p-2 border border-slate-300">ID Lembaga</th>
                  <th className="p-2 border border-slate-300">Nama Lembaga Kontingen</th>
                  <th className="p-2 border border-slate-300">Kabupaten/Kota</th>
                  <th className="p-2 border border-slate-300 text-center">Status</th>
                  <th className="p-2 border border-slate-300 text-center">Jumlah Atlet</th>
                  <th className="p-2 border border-slate-300 text-center">Terverifikasi</th>
                </tr>
              </thead>
              <tbody>
                {lembagaList.map((l, i) => {
                  const participants = pesertaList.filter(p => p.lembagaId === l.id);
                  const verified = participants.filter(p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL').length;

                  return (
                    <tr key={l.id} className="border border-slate-300 hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{i + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{l.id}</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{l.nama}</td>
                      <td className="p-2 border border-slate-300">{l.kabupatenKota}, {l.provinsi}</td>
                      <td className="p-2 border border-slate-300 text-center">{l.status}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{participants.length}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-emerald-700 font-bold">{verified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Rekap Gender */}
        {activeTab === 'GENDER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <span className="text-xs font-bold text-blue-800 uppercase block">Total Putra</span>
                <span className="text-3xl font-extrabold text-blue-900 font-mono">
                  {pesertaList.filter(p => p.jenisKelamin === 'L').length} Atlet
                </span>
              </div>
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg text-center">
                <span className="text-xs font-bold text-pink-800 uppercase block">Total Putri</span>
                <span className="text-3xl font-extrabold text-pink-900 font-mono">
                  {pesertaList.filter(p => p.jenisKelamin === 'P').length} Atlet
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Rekap Status */}
        {activeTab === 'STATUS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['TERVERIFIKASI', 'MENUNGGU VERIFIKASI', 'PERLU PERBAIKAN', 'DITOLAK'].map(st => {
              const count = pesertaList.filter(p => p.status === st).length;
              return (
                <div key={st} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <span className="text-xs font-bold text-slate-600 uppercase block mb-1">{st}</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">{count}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {pesertaList.length > 0 ? Math.round((count / pesertaList.length) * 100) : 0}% dari total
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Official signature footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between text-xs text-center text-slate-800">
          <div>
            <span className="block text-slate-500 text-[10px]">Mengetahui,</span>
            <span className="block font-bold">Penanggung Jawab Teknis PORSENI</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">Drs. H. Muhammad Zain, M.Ag.</span>
            <span className="text-[10px] text-slate-500 font-mono">NIP. 196805121994031001</span>
          </div>

          <div>
            <span className="block text-slate-500 text-[10px]">Jakarta, {new Date().toLocaleDateString('id-ID')}</span>
            <span className="block font-bold">Ketua Panitia Pelaksana Pusat</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">Dr. H. Ahmad Fauzan, M.Si.</span>
            <span className="text-[10px] text-slate-500 font-mono">NIP. 197401181999031003</span>
          </div>
        </div>
      </div>
    </div>
  );
};
