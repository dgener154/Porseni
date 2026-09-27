import React, { useState } from 'react';
import { Lembaga } from '../../types';
import { ExcelImportRow, ExcelService } from '../../services/excel';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

interface LembagaImportExcelProps {
  lembaga: Lembaga;
  onSuccessImport: (count: number) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaImportExcel: React.FC<LembagaImportExcelProps> = ({
  lembaga,
  onSuccessImport,
  onShowToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importResult, setImportResult] = useState<{
    rows: ExcelImportRow[];
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  } | null>(null);
  const [parseError, setParseError] = useState('');
  const [committing, setCommitting] = useState(false);

  const handleDownloadTemplate = () => {
    ExcelService.downloadPesertaTemplate();
    onShowToast('info', 'Template Excel pendaftaran peserta berhasil diunduh.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParseError('');
      setParsing(true);

      try {
        const result = await ExcelService.parsePesertaExcel(selectedFile, lembaga.id);
        setImportResult(result);
      } catch (err: any) {
        setParseError(err.message || 'Gagal memproses file Excel.');
        setImportResult(null);
      } finally {
        setParsing(false);
      }
    }
  };

  const handleCommitValid = () => {
    if (!importResult) return;
    const validRows = importResult.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      onShowToast('error', 'Tidak ada data valid yang dapat disimpan.');
      return;
    }

    setCommitting(true);
    const { savedCount, errors } = ExcelService.commitValidRows(validRows, lembaga.id);
    setCommitting(false);

    if (savedCount > 0) {
      onSuccessImport(savedCount);
      setFile(null);
      setImportResult(null);
    } else {
      onShowToast('error', 'Gagal menyimpan: ' + errors.join(', '));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Instruction & Template Download */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Import Data Peserta Massal dari Excel
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Daftarkan seluruh peserta kontingen Anda secara cepat menggunakan berkas spreadsheet (.xlsx/.xls).
              Sistem akan memvalidasi NISN, NIK, usia, serta kuota cabang lomba secara otomatis sebelum disimpan.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-emerald-950" />
            <span>Unduh Template Excel Resmi</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-6 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-emerald-50/50 transition-colors">
          <Upload className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Pilih Berkas Excel untuk Diunggah'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Format file didukung: .xlsx atau .xls (Maks. 5MB)
          </p>

          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors">
            <Upload className="w-4 h-4" />
            <span>{file ? 'Ganti File Excel' : 'Pilih File dari Komputer'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {parsing && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-600 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-700 animate-spin" />
          <span>Menganalisis baris dan memvalidasi keabsahan data Excel...</span>
        </div>
      )}

      {parseError && (
        <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-2xs flex items-start gap-3 text-xs text-rose-700 bg-rose-50">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Gagal Membaca File</h4>
            <p className="mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {/* Validation Result & Preview */}
      {importResult && (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Total Baris File</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {importResult.totalRows}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/50">
              <span className="text-[11px] text-emerald-800 font-semibold block">Data Valid (Siap Disimpan)</span>
              <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                {importResult.validCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/50">
              <span className="text-[11px] text-rose-800 font-semibold block">Data Tidak Valid / Gagal</span>
              <span className="text-2xl font-extrabold text-rose-600 font-mono">
                {importResult.invalidCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/50">
              <span className="text-[11px] text-amber-800 font-semibold block">Terdeteksi Duplikat</span>
              <span className="text-2xl font-extrabold text-amber-600 font-mono">
                {importResult.duplicateCount}
              </span>
            </div>
          </div>

          {/* Action commit bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Menampilkan pratinjau hasil validasi.{' '}
              {importResult.validCount > 0 ? (
                <strong className="text-emerald-800 font-bold">
                  {importResult.validCount} data valid siap diimpor ke sistem.
                </strong>
              ) : (
                <span className="text-rose-600 font-bold">
                  Perbaiki kesalahan dalam Excel sebelum mengimpor.
                </span>
              )}
            </div>

            <button
              onClick={handleCommitValid}
              disabled={importResult.validCount === 0 || committing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {committing ? 'Menyimpan...' : `Simpan ${importResult.validCount} Data Valid`}
              </span>
            </button>
          </div>

          {/* Table Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-3 text-center">Baris</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Nama Peserta</th>
                    <th className="px-3 py-3">NISN / NIK</th>
                    <th className="px-3 py-3">JK</th>
                    <th className="px-3 py-3">Cabang Lomba</th>
                    <th className="px-3 py-3">Catatan / Validasi Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.rows.map(row => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                    >
                      <td className="px-3 py-2 text-center font-mono text-slate-400">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            VALID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            GAGAL
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">{row.nama || '-'}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {row.nisn || '-'} / {row.nik || '-'}
                      </td>
                      <td className="px-3 py-2">{row.jenisKelamin}</td>
                      <td className="px-3 py-2">{row.cabangNamaOrKode || '-'}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                            {row.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Lolos seluruh kriteria validasi.
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
