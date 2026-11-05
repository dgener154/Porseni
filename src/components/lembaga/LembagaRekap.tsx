import React, { useState, useRef, useEffect } from 'react';
import { CabangLomba, Lembaga, Peserta } from '../../types';
import { PesertaStatusBadge } from '../common/UIComponents';
import { ReportExportService } from '../../services/reportExport';
import {
  Download,
  ChevronDown,
  FileText,
  FileType2,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
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

  // Dropdown state for export options
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = pesertaList.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase()) ||
      p.nisn.includes(search) ||
      p.nik.includes(search);
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchGender = !filterGender || p.jenisKelamin === filterGender;
    return matchSearch && matchCabang && matchStatus && matchGender;
  });

  // Handle Export to PDF
  const handleExportPdf = async () => {
    setDropdownOpen(false);
    if (filtered.length === 0) {
      onShowToast('warning', 'Tidak ada data peserta yang cocok untuk diekspor ke PDF.');
      return;
    }

    try {
      setIsExporting(true);
      onShowToast('info', 'Sedang menyiapkan dan memformat dokumen PDF...');
      const result = await ReportExportService.exportRekapPdf(lembaga, filtered, cabangList);
      onShowToast('success', result.message);
    } catch (e: any) {
      onShowToast('error', e.message || 'Gagal mengekspor laporan ke PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export to Word (.docx)
  const handleExportWord = async () => {
    setDropdownOpen(false);
    if (filtered.length === 0) {
      onShowToast('warning', 'Tidak ada data peserta yang cocok untuk diekspor ke Word.');
      return;
    }

    try {
      setIsExporting(true);
      onShowToast('info', 'Sedang memproses dan menyusun tabel dokumen Microsoft Word (.docx)...');
      const result = await ReportExportService.exportRekapWord(lembaga, filtered, cabangList);
      onShowToast('success', result.message);
    } catch (e: any) {
      onShowToast('error', e.message || 'Gagal mengekspor laporan ke Word.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Export Header (No print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Rekapitulasi Kontingen & Ekspor Laporan
            </h2>
            <p className="text-xs text-slate-500">
              {lembaga.nama} · Menampilkan <strong className="text-emerald-800">{filtered.length}</strong> dari {pesertaList.length} peserta
            </p>
          </div>

          {/* Export Dropdown Menu (Strictly NO Print Button) */}
          <div className="relative shrink-0 self-start sm:self-auto" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isExporting}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              aria-expanded={dropdownOpen}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses...' : 'Ekspor Laporan'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Options */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in slide-in-from-top-1">
                <button
                  onClick={handleExportPdf}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">Ekspor ke PDF (.pdf)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Format A4 Resmi & Tanda Tangan</span>
                  </div>
                </button>

                <button
                  onClick={handleExportWord}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer mt-1"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileType2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">Ekspor ke Word (.docx)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Tabel Dokumen Microsoft Word Asli</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, NISN, atau no. peserta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <select
              value={filterCabang}
              onChange={e => setFilterCabang(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            >
              <option value="">Semua Jenis Kelamin</option>
              <option value="L">Laki-Laki (Putra)</option>
              <option value="P">Perempuan (Putri)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Report Sheet Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            DAFTAR REKAPITULASI PESERTA PEKAN OLAHRAGA DAN SENI (PORSENI)
          </h2>
          <h3 className="text-xs font-bold text-slate-700 uppercase">
            KONTINGEN: {lembaga.nama} ({lembaga.id})
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            NPSN: {lembaga.npsn || '-'} · {lembaga.alamat}, {lembaga.kabupatenKota}, {lembaga.provinsi}
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

        {/* Official Signatures footer */}
        <div className="mt-8 pt-4 flex justify-between text-xs text-slate-800 text-center">
          <div>
            <span className="block text-[11px] text-slate-500">Mengetahui,</span>
            <span className="block font-bold">Kepala Lembaga / Pimpinan Kontingen</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">{lembaga.pimpinanNama || '__________________________'}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {lembaga.pimpinanNip ? `NIP. ${lembaga.pimpinanNip}` : 'Pimpinan Satuan Pendidikan'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-500">
              {lembaga.kabupatenKota || 'Kota'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="block font-bold">Petugas Operator Kontingen</span>
            <div className="h-16"></div>
            <span className="font-bold underline block">{lembaga.operatorNama || '__________________________'}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {lembaga.operatorNik ? `NIK: ${lembaga.operatorNik}` : 'Petugas Kontingen'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
