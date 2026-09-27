import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import { Peserta, Lembaga, CabangLomba, PengaturanSistem } from '../../types';
import { PorseniEmblem } from '../common/OfficialLogos';
import { PesertaStatusBadge } from '../common/UIComponents';
import {
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  Building,
  Trophy,
  Calendar,
  User,
  ArrowLeft,
} from 'lucide-react';

interface ValidasiPesertaProps {
  initialId?: string;
  onBackToHome: () => void;
}

export const ValidasiPeserta: React.FC<ValidasiPesertaProps> = ({
  initialId = '',
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialId);
  const [searched, setSearched] = useState(false);
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [lembaga, setLembaga] = useState<Lembaga | null>(null);
  const [cabang, setCabang] = useState<CabangLomba | null>(null);
  const [settings, setSettings] = useState<PengaturanSistem>(StorageService.getPengaturan());

  const handleSearch = (idToSearch: string) => {
    const cleanId = idToSearch.trim();
    if (!cleanId) return;

    setSearched(true);
    const foundPeserta = StorageService.getPesertaById(cleanId);
    if (foundPeserta) {
      setPeserta(foundPeserta);
      const l = StorageService.getLembagaById(foundPeserta.lembagaId);
      const c = StorageService.getCabangById(foundPeserta.cabangId);
      setLembaga(l || null);
      setCabang(c || null);
    } else {
      setPeserta(null);
      setLembaga(null);
      setCabang(null);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PorseniEmblem size={44} />
            <div>
              <h1 className="text-base font-bold text-amber-300 leading-tight">
                PORTAL VALIDASI KEASLIAN KARTU PESERTA
              </h1>
              <p className="text-xs text-emerald-200">
                {settings.namaPorseni} {settings.tahun}
              </p>
            </div>
          </div>
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-emerald-800/80 hover:bg-emerald-800 rounded-lg transition-colors border border-emerald-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </header>

      {/* Main Validation View */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 mb-6">
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-700 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Pemeriksaan Status & Keaslian Atlet / Seniman
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Masukkan Nomor Peserta resmi (contoh: PORSENI-2026-00101) atau ID Peserta (contoh: PS-2026-00001) yang tertera pada Kartu Peserta atau hasil scan QR Code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Contoh: PORSENI-2026-00101 atau PS-2026-00001..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors shrink-0"
            >
              Periksa Keabsahan
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <span>Contoh Nomor:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('PORSENI-2026-00101');
                handleSearch('PORSENI-2026-00101');
              }}
              className="text-emerald-700 hover:underline font-mono"
            >
              PORSENI-2026-00101
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('PORSENI-2026-00102');
                handleSearch('PORSENI-2026-00102');
              }}
              className="text-emerald-700 hover:underline font-mono"
            >
              PORSENI-2026-00102
            </button>
          </div>
        </div>

        {/* Validation Result */}
        {searched && (
          <div>
            {peserta ? (
              <div className="bg-white rounded-xl shadow-md border-2 border-emerald-600 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Verified Header */}
                <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">
                        DATA PESERTA TERVERIFIKASI RESMI
                      </h3>
                      <p className="text-[11px] text-emerald-100">
                        Terdaftar di Pangkalan Data PORSENI Nasional
                      </p>
                    </div>
                  </div>
                  <PesertaStatusBadge status={peserta.status} />
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-100">
                    <div className="w-28 h-36 rounded-lg border-2 border-emerald-600 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {peserta.fotoUrl ? (
                        <img
                          src={peserta.fotoUrl}
                          alt={peserta.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <User className="w-10 h-10 mx-auto text-slate-300" />
                          <span className="text-[10px] font-semibold text-slate-500 block mt-1">
                            Foto Resmi
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Nama Peserta
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          {peserta.nama}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">Nomor Peserta</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {peserta.nomorPeserta}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">NISN</span>
                          <span className="font-mono font-bold text-slate-800">
                            {peserta.nisn}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-1">
                        <p className="flex items-center gap-2 justify-center sm:justify-start">
                          <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-medium text-slate-900">
                            {lembaga?.nama || 'Kontingen Lembaga'}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 justify-center sm:justify-start">
                          <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {cabang?.nama} ({peserta.kategoriLomba})
                          </span>
                        </p>
                        <p className="flex items-center gap-2 justify-center sm:justify-start">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Tahun Kegiatan: {settings.tahun} · Jenjang: {peserta.tingkat}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dokumen ini sah dan dikeluarkan secara resmi oleh Panitia Pelaksana{' '}
                      {settings.namaPorseni}. Dilarang memalsukan nomor atau identitas peserta.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xs border-2 border-rose-300 p-8 text-center animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  DATA PESERTA TIDAK DITEMUKAN
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Nomor peserta <span className="font-mono font-bold text-rose-600">"{searchQuery}"</span> tidak tercatat dalam pangkalan data resmi PORSENI {settings.tahun}. Pastikan Anda memasukkan nomor peserta yang benar sesuai fisik kartu peserta.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© {settings.tahun} {settings.namaPorseni}. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
};
