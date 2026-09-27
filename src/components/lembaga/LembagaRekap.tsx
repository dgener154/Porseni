import React, { useState } from 'react';
import { CabangLomba, Lembaga, Peserta } from '../../types';
import { ExcelService } from '../../services/excel';
import { PesertaStatusBadge } from '../common/UIComponents';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

interface LembagaRekapProps {
  lembaga: Lembaga;
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaRekap: React.FC<LembagaRekapProps> = ({
  lembaga,
  pesertaList,
  cabangList,
  onShowToast,
}) => {
  const [filterCabang, setFilterCabang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [search, setSearch] = useState('');

  const filtered = pesertaList.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase()) ||
      p.nisn.includes(search);
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchGender = !filterGender || p.jenisKelamin === filterGender;
    return matchSearch && matchCabang && matchStatus && matchGender;
  });

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      onShowToast('warning', 'Tidak ada data untuk diekspor.');
      return;
    }
    ExcelService.exportPesertaToExcel(filtered, `Rekap_Peserta_${lembaga.kodeLembaga}`);
    onShowToast('success', `Berhasil mengekspor ${filtered.length} data peserta ke Excel.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Export Header (No print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Rekapitulasi Kontingen & Ekspor Laporan
            </h2>
            <p className="text-xs text-slate-500">
              {lembaga.nama} · Menampilkan {filtered.length} dari {pesertaList.length} peserta
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor ke Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <input
              type="text"
              placeholder="Cari nama atau no. peserta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterCabang}
              onChange={e => setFilterCabang(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Cabang Lomba</option>
              {cabangList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="TERVERIFIKASI">TERVERIFIKASI</option>
              <option value="MENUNGGU VERIFIKASI">MENUNGGU VERIFIKASI</option>
              <option value="PERLU PERBAIKAN">PERLU PERBAIKAN</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>

          <div>
            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Jenis Kelamin</option>
              <option value="L">Laki-Laki (Putra)</option>
              <option value="P">Perempuan (Putri)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Printable Report Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 print:border-none print:shadow-none print:p-0">
        {/* Kop Surat Resmi on Print */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            DAFTAR REKAPITULASI PESERTA PEKAN OLAHRAGA DAN SENI (PORSENI)
          </h2>
          <h3 className="text-xs font-bold text-slate-700 uppercase">
            KONTINGEN: {lembaga.nama} ({lembaga.id})
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            NPSN: {lembaga.npsn} · {lembaga.alamat}, {lembaga.kabupatenKota}, {lembaga.provinsi}
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                <th className="p-2 border border-slate-300 text-center w-8">No</th>
                <th className="p-2 border border-slate-300">Nomor Peserta</th>
                <th className="p-2 border border-slate-300">Nama Lengkap</th>
                <th className="p-2 border border-slate-300">NISN / NIK</th>
                <th className="p-2 border border-slate-300 text-center">JK</th>
                <th className="p-2 border border-slate-300">Cabang Lomba</th>
                <th className="p-2 border border-slate-300">Kategori</th>
                <th className="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400 border border-slate-300">
                    Tidak ada peserta yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const cabang = cabangList.find(c => c.id === p.cabangId);
                  return (
                    <tr key={p.id} className="border border-slate-300 hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-emerald-900">
                        {p.nomorPeserta}
                      </td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{p.nama}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[11px]">
                        {p.nisn} / {p.nik}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">{p.jenisKelamin}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{cabang?.nama}</td>
                      <td className="p-2 border border-slate-300">{p.kategoriLomba}</td>
                      <td className="p-2 border border-slate-300 text-center">
                        <PesertaStatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures footer on print */}
        <div className="mt-8 pt-4 flex justify-between text-xs text-slate-800 text-center">
          <div>
            <span className="block text-[11px] text-slate-500">Mengetahui,</span>
            <span className="block font-bold">Kepala Lembaga / Pimpinan Kontingen</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">{lembaga.pimpinanNama}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {lembaga.pimpinanNip ? `NIP. ${lembaga.pimpinanNip}` : 'Pimpinan Satuan Pendidikan'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-500">
              {lembaga.kabupatenKota}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="block font-bold">Petugas Operator Kontingen</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">{lembaga.operatorNama}</span>
            <span className="text-[10px] text-slate-500 font-mono">NIK: {lembaga.operatorNik}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
