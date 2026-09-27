import React, { useState } from 'react';
import { CabangLomba, Lembaga, Peserta } from '../../types';
import { KartuPesertaView } from '../common/KartuPesertaView';
import {
  Printer,
  CheckSquare,
  Square,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface LembagaKartuProps {
  lembaga: Lembaga;
  pesertaList: Peserta[];
  cabangList: CabangLomba[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaKartu: React.FC<LembagaKartuProps> = ({
  lembaga,
  pesertaList,
  cabangList,
  onShowToast,
}) => {
  // Only participants that are verified or final can have cards printed
  const eligiblePeserta = pesertaList.filter(
    p => p.status === 'TERVERIFIKASI' || p.status === 'FINAL'
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(
    eligiblePeserta.map(p => p.id)
  );
  const [filterCabang, setFilterCabang] = useState('');
  const [search, setSearch] = useState('');
  const [isPrintMode, setIsPrintMode] = useState(false);

  const filteredEligible = eligiblePeserta.filter(p => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(search.toLowerCase());
    const matchCabang = !filterCabang || p.cabangId === filterCabang;
    return matchSearch && matchCabang;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredEligible.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleTriggerPrint = () => {
    if (selectedIds.length === 0) {
      onShowToast('warning', 'Pilih minimal satu kartu peserta untuk dicetak.');
      return;
    }
    window.print();
  };

  const selectedPesertaToPrint = eligiblePeserta.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Print Control Bar (Hidden on print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Pencetakan Kartu Tanda Peserta Resmi
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Total {eligiblePeserta.length} atlet/seniman telah disahkan oleh Panitia Pusat dan siap dicetak.
            </p>
          </div>

          <button
            onClick={handleTriggerPrint}
            disabled={selectedIds.length === 0}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {selectedIds.length} Kartu Terpilih</span>
          </button>
        </div>

        {/* Filters and Selection Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Cari nama atau nomor peserta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterCabang}
              onChange={e => setFilterCabang(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Cabang Lomba</option>
              {cabangList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.kategori})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex items-center justify-end gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md font-medium"
            >
              Pilih Semua ({filteredEligible.length})
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md font-medium"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      </div>

      {eligiblePeserta.length === 0 ? (
        <div className="no-print bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            Belum Ada Kartu Peserta yang Siap Dicetak
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Kartu peserta hanya dapat dicetak setelah berkas dan data peserta disetujui (status: TERVERIFIKASI) oleh Administrator Panitia.
          </p>
        </div>
      ) : (
        /* Printable Cards Container (Grid on screen, formatted sheets on print) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {selectedPesertaToPrint.map(peserta => {
            const isSelected = selectedIds.includes(peserta.id);
            return (
              <div
                key={peserta.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs relative print:p-0 print:border-none print:shadow-none"
              >
                {/* Select Checkbox on UI view */}
                <div className="no-print flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(peserta.id)}
                      className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>{peserta.nama}</span>
                  </label>
                  <span className="font-mono text-[11px] text-emerald-800 font-bold">
                    {peserta.nomorPeserta}
                  </span>
                </div>

                {/* The Official Card */}
                <div className="flex justify-center">
                  <KartuPesertaView
                    peserta={peserta}
                    lembaga={lembaga}
                    cabang={cabangList.find(c => c.id === peserta.cabangId)}
                    showPrintActions={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
