import React, { useState, useEffect } from 'react';
import { CabangLomba, Lembaga, Peserta } from '../../types';
import { KartuPesertaView } from '../common/KartuPesertaView';
import { AuthService } from '../../services/auth';
import { CardPrintingService, CARD_ACCESS_DENIED_MESSAGE } from '../../services/cardPrinting';
import {
  Printer,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Eye,
  CheckCircle,
  Building,
  Download,
  FileDown,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

interface LembagaKartuProps {
  lembaga?: Lembaga;
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  lembagaList?: Lembaga[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaKartu: React.FC<LembagaKartuProps> = ({
  lembaga: propLembaga,
  pesertaList,
  cabangList,
  lembagaList,
  onShowToast,
}) => {
  const fallbackLembaga: Lembaga = {
    id: 'KONTINGEN',
    kodeLembaga: 'LG-001',
    nama: 'Kontingen Lembaga',
    npsn: '-',
    jenjang: 'MA/SMA/SMK',
    alamat: '-',
    desaKelurahan: '-',
    kecamatan: '-',
    kabupatenKota: '-',
    provinsi: '-',
    kodePos: '-',
    pimpinanNama: 'Pimpinan Kontingen',
    pimpinanHp: '-',
    pimpinanEmail: '-',
    operatorNama: 'Operator',
    operatorNik: '-',
    operatorHp: '-',
    operatorEmail: '-',
    username: 'operator',
    passwordHash: '',
    status: 'AKTIF',
    periodeId: 'PORSENI-2026',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const lembaga = propLembaga || lembagaList?.[0] || fallbackLembaga;
  const session = AuthService.getSession();
  const isLembaga = session?.user.role === 'LEMBAGA';
  const isAdmin = session?.user.role === 'ADMIN';

  // Only participants that are verified or final can have cards
  const eligiblePeserta = pesertaList.filter(
    p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL'
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterCabang, setFilterCabang] = useState('');
  const [filterLembagaId, setFilterLembagaId] = useState('');
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSheetPreviewModal, setShowSheetPreviewModal] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Filtered participants according to active search and filters
  const filteredEligible = eligiblePeserta.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase()) ||
      (p.nisn && p.nisn.includes(search)) ||
      (p.nis && p.nis.includes(search));
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    const matchLembaga = !filterLembagaId || p.lembagaId === filterLembagaId;
    return matchSearch && matchCabang && matchLembaga;
  });

  // Synchronize selectedIds: when Admin opens page and eligible participants exist,
  // ensure selectedIds is automatically populated so print button is immediately ready!
  useEffect(() => {
    if (isAdmin && eligiblePeserta.length > 0) {
      setSelectedIds(prev => {
        if (prev.length === 0) {
          return eligiblePeserta.map(p => p.id);
        }
        return prev;
      });
    }
  }, [eligiblePeserta.length, isAdmin]);

  const handleToggleSelect = (id: string) => {
    if (isLembaga) return; // Disallowed for Lembaga
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isLembaga) return; // Disallowed for Lembaga
    setSelectedIds(filteredEligible.map(p => p.id));
    onShowToast('info', `Memilih seluruh ${filteredEligible.length} kartu peserta.`);
  };

  const handleSelectFirst4 = () => {
    if (isLembaga) return; // Disallowed for Lembaga
    const first4 = filteredEligible.slice(0, 4).map(p => p.id);
    setSelectedIds(first4);
    onShowToast('info', `Memilih 4 kartu pertama (pas 1 lembar kertas A4).`);
  };

  const handleDeselectAll = () => {
    if (isLembaga) return; // Disallowed for Lembaga
    setSelectedIds([]);
  };

  // 1. Direct Print to Printer (with isolated iframe engine & fallback)
  const handleTriggerPrint = async () => {
    const check = CardPrintingService.validatePrintPermission();
    if (!check.allowed) {
      onShowToast('error', check.message || CARD_ACCESS_DENIED_MESSAGE);
      return;
    }

    if (selectedIds.length === 0) {
      onShowToast('warning', 'Pilih minimal satu kartu peserta untuk dicetak.');
      return;
    }

    try {
      setIsProcessing(true);
      onShowToast('info', `Menyiapkan cetak untuk ${selectedIds.length} kartu peserta...`);
      const result = await CardPrintingService.printBatchCards(selectedIds);
      onShowToast('success', result.message);
    } catch (e: any) {
      onShowToast('error', e.message || 'Gagal menyiapkan proses pencetakan.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Direct Download PDF (4 cards per A4 page in 2x2 grid via jsPDF)
  const handleDownloadBatchPdf = async () => {
    const check = CardPrintingService.validatePrintPermission();
    if (!check.allowed) {
      onShowToast('error', check.message || CARD_ACCESS_DENIED_MESSAGE);
      return;
    }

    if (selectedIds.length === 0) {
      onShowToast('warning', 'Pilih minimal satu kartu peserta untuk diunduh ke PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      onShowToast('info', `Menyusun dokumen PDF A4 resmi (${selectedIds.length} kartu peserta)...`);
      const result = await CardPrintingService.exportBatchCardsPdf(selectedIds);
      onShowToast('success', result.message);
    } catch (e: any) {
      onShowToast('error', e.message || 'Gagal mengekspor kartu peserta ke PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Print single card from card list
  const handlePrintSingle = async (pesertaId: string) => {
    try {
      setIsProcessing(true);
      onShowToast('info', 'Menyiapkan cetak kartu peserta...');
      const res = await CardPrintingService.printSingleCard(pesertaId);
      onShowToast('success', res.message);
    } catch (e: any) {
      onShowToast('error', e.message || CARD_ACCESS_DENIED_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Download single card PDF
  const handleDownloadSinglePdf = async (pesertaId: string) => {
    try {
      setIsProcessing(true);
      onShowToast('info', 'Mengunduh file PDF kartu peserta...');
      const res = await CardPrintingService.exportCardPdf(pesertaId);
      onShowToast('success', res.message);
    } catch (e: any) {
      onShowToast('error', e.message || CARD_ACCESS_DENIED_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

  // Selected participant objects for sheet preview
  const selectedPesertaObjects = eligiblePeserta.filter(p => selectedIds.includes(p.id));
  const totalSheetPages = Math.max(1, Math.ceil(selectedPesertaObjects.length / 4));
  const currentSheetCards = selectedPesertaObjects.slice(previewPageIndex * 4, (previewPageIndex + 1) * 4);

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isLembaga ? (
                <Eye className="w-5 h-5 text-emerald-700" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              )}
              <h2 className="text-base font-extrabold text-slate-900">
                {isLembaga
                  ? 'Pratinjau Kartu Peserta Resmi'
                  : 'Pusat Pencetakan Kartu Tanda Peserta Resmi'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {isLembaga ? (
                <>
                  Total <strong className="text-emerald-800">{eligiblePeserta.length}</strong> atlet/seniman telah disahkan oleh Panitia Pusat.
                </>
              ) : (
                <>
                  Total <strong className="text-emerald-800">{eligiblePeserta.length}</strong> atlet/seniman terverifikasi. Terpilih: <strong className="text-emerald-800">{selectedIds.length}</strong> kartu ({Math.ceil(selectedIds.length / 4)} lembar A4).
                </>
              )}
            </p>
          </div>

          {/* Admin-only Print & PDF Action Buttons: Strictly NOT rendered for Pihak Lembaga */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
              {/* Preview Sheet Modal Button */}
              <button
                onClick={() => {
                  setPreviewPageIndex(0);
                  setShowSheetPreviewModal(true);
                }}
                disabled={selectedIds.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Lihat tata letak 4 kartu per lembar A4 sebelum mencetak"
              >
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Pratinjau Lembar A4</span>
              </button>

              {/* Direct PDF Download Button (Always 100% reliable) */}
              <button
                onClick={handleDownloadBatchPdf}
                disabled={selectedIds.length === 0 || isProcessing}
                className="px-4 py-2 text-xs font-bold text-emerald-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                title="Unduh dokumen PDF A4 resmi (4 kartu per lembar)"
              >
                <FileDown className="w-4 h-4 text-emerald-950" />
                <span>Unduh PDF ({selectedIds.length})</span>
              </button>

              {/* Direct Print to Printer */}
              <button
                onClick={handleTriggerPrint}
                disabled={selectedIds.length === 0 || isProcessing}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                title="Cetak langsung ke mesin printer fisik"
              >
                <Printer className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses...' : `Cetak (${selectedIds.length})`}</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          <div className={isAdmin && lembagaList ? 'sm:col-span-4' : isLembaga ? 'sm:col-span-6' : 'sm:col-span-4'}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, NISN, atau no. peserta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
            </div>
          </div>

          {isAdmin && lembagaList && (
            <div className="sm:col-span-4">
              <select
                value={filterLembagaId}
                onChange={e => setFilterLembagaId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              >
                <option value="">Semua Kontingen Lembaga</option>
                {lembagaList.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={isAdmin && lembagaList ? 'sm:col-span-4' : isLembaga ? 'sm:col-span-6' : 'sm:col-span-4'}>
            <select
              value={filterCabang}
              onChange={e => setFilterCabang(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            >
              <option value="">Semua Cabang Lomba</option>
              {cabangList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.kategori})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection Quick Pills (Admin Only) */}
        {isAdmin && eligiblePeserta.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span>Pintasan Seleksi:</span>
              <button
                onClick={handleSelectFirst4}
                className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md font-semibold cursor-pointer transition-colors"
              >
                Pilih 4 Kartu (1 Lembar A4)
              </button>
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium cursor-pointer transition-colors"
              >
                Pilih Semua Terverifikasi ({filteredEligible.length})
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 rounded-md font-medium cursor-pointer"
              >
                Batalkan Pilihan
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Status: <span className="font-bold text-emerald-800">{selectedIds.length}</span> terpilih dari {filteredEligible.length} peserta tampil
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {eligiblePeserta.length === 0 ? (
        <div className="no-print bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            {isLembaga
              ? 'Belum Ada Kartu Peserta yang Disahkan'
              : 'Belum Ada Kartu Peserta yang Siap Dicetak'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {isLembaga
              ? 'Kartu tanda peserta hanya dapat dilihat setelah berkas dan data peserta disahkan (status: TERVERIFIKASI) oleh Administrator Panitia Pusat.'
              : 'Kartu tanda peserta siap dicetak setelah berkas dan data peserta disetujui (status: TERVERIFIKASI) oleh Administrator Panitia.'}
          </p>
        </div>
      ) : filteredEligible.length === 0 ? (
        <div className="no-print bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Tidak ada kartu peserta yang cocok dengan filter atau kata kunci pencarian.
        </div>
      ) : (
        /* Cards Container: Grid layout on screen */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEligible.map(peserta => {
            const isSelected = selectedIds.includes(peserta.id);
            const currentLembaga =
              (lembagaList && lembagaList.find(l => l.id === peserta.lembagaId)) || lembaga;

            return (
              <div
                key={peserta.id}
                className={`bg-white rounded-xl p-4 border transition-all ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 shadow-2xs opacity-80'
                }`}
              >
                {/* Header bar on card with Checkbox & Single Card Actions for Admin */}
                {isAdmin ? (
                  <div className="no-print flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(peserta.id)}
                        className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="line-clamp-1">{peserta.nama}</span>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadSinglePdf(peserta.id)}
                        disabled={isProcessing}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        title="Unduh PDF 1 Kartu Ini"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handlePrintSingle(peserta.id)}
                        disabled={isProcessing}
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        title="Cetak 1 Kartu Ini"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Cetak</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Lembaga view: Read-only header, NO checkbox */
                  <div className="no-print flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900">{peserta.nama}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {peserta.nomorPeserta}
                    </span>
                  </div>
                )}

                {/* The Official ID Card */}
                <div className="flex justify-center">
                  <KartuPesertaView
                    peserta={peserta}
                    lembaga={currentLembaga}
                    cabang={cabangList.find(c => c.id === peserta.cabangId)}
                    showPrintActions={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* A4 Sheet Print Preview Modal */}
      {showSheetPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-900 rounded-lg text-amber-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Pratinjau Lembar A4 Cetak Kartu (4 Kartu per Halaman)
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Halaman {previewPageIndex + 1} dari {totalSheetPages} · Total {selectedPesertaObjects.length} kartu terpilih
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSheetPreviewModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Visual Representation of A4 2x2 Grid */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center">
              {/* Paper A4 Container Simulation */}
              <div className="bg-white shadow-xl border border-slate-300 rounded-lg p-6 w-full max-w-2xl relative">
                {/* Simulated center cutting guides */}
                <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-slate-300 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-slate-300 pointer-events-none"></div>

                <div className="grid grid-cols-2 gap-4">
                  {currentSheetCards.map(peserta => {
                    const currentLembaga =
                      (lembagaList && lembagaList.find(l => l.id === peserta.lembagaId)) || lembaga;

                    return (
                      <div key={peserta.id} className="p-1 border border-slate-200 rounded-lg bg-white flex justify-center">
                        <KartuPesertaView
                          peserta={peserta}
                          lembaga={currentLembaga}
                          cabang={cabangList.find(c => c.id === peserta.cabangId)}
                          showPrintActions={false}
                        />
                      </div>
                    );
                  })}
                  {/* Fill empty slots on page if less than 4 */}
                  {Array.from({ length: Math.max(0, 4 - currentSheetCards.length) }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-300 min-h-[260px]"
                    >
                      <Layers className="w-8 h-8 mb-2" />
                      <span className="text-xs font-semibold">Slot Kartu Kosong</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
                  Garis putus-putus abu-abu menunjukkan panduan pemotongan kertas A4 setelah dicetak.
                </div>
              </div>

              {/* Page Navigator */}
              {totalSheetPages > 1 && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setPreviewPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewPageIndex === 0}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700">
                    Lembar {previewPageIndex + 1} dari {totalSheetPages}
                  </span>
                  <button
                    onClick={() => setPreviewPageIndex(prev => Math.min(totalSheetPages - 1, prev + 1))}
                    disabled={previewPageIndex === totalSheetPages - 1}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Pilih aksi untuk {selectedPesertaObjects.length} kartu terpilih:
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSheetPreviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowSheetPreviewModal(false);
                    handleDownloadBatchPdf();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Dokumen PDF (A4)</span>
                </button>
                <button
                  onClick={() => {
                    setShowSheetPreviewModal(false);
                    handleTriggerPrint();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak ke Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
