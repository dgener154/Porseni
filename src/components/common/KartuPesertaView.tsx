import React, { useEffect, useRef, useState } from 'react';
import { Peserta, Lembaga, CabangLomba, PengaturanSistem } from '../../types';
import { StorageService } from '../../services/storage';
import { CodeGeneratorService } from '../../services/barcode';
import { PorseniEmblem } from './OfficialLogos';
import { Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface KartuPesertaViewProps {
  peserta: Peserta;
  lembaga?: Lembaga;
  cabang?: CabangLomba;
  pengaturan?: PengaturanSistem;
  showPrintActions?: boolean;
}

export const KartuPesertaView: React.FC<KartuPesertaViewProps> = ({
  peserta,
  lembaga: propLembaga,
  cabang: propCabang,
  pengaturan: propPengaturan,
  showPrintActions = true,
}) => {
  const lembaga = propLembaga || StorageService.getLembagaById(peserta.lembagaId);
  const cabang = propCabang || StorageService.getCabangById(peserta.cabangId);
  const settings = propPengaturan || StorageService.getPengaturan();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Generate QR code pointing to real verification link
    const validationUrl = CodeGeneratorService.getValidationUrl(peserta.nomorPeserta);
    CodeGeneratorService.generateQrCodeDataUrl(validationUrl).then(url => {
      setQrCodeUrl(url);
    });

    // Render Barcode
    if (barcodeSvgRef.current) {
      CodeGeneratorService.renderBarcodeToElement(
        barcodeSvgRef.current,
        peserta.nomorPeserta,
        { height: 26, fontSize: 10, displayValue: true }
      );
    }
  }, [peserta.nomorPeserta]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {showPrintActions && (
        <div className="no-print flex items-center justify-between w-full max-w-md mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kartu Identitas Peserta Resmi</span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      )}

      {/* Official ID Card - Exact Standard ID proportions with Emerald & Gold theme */}
      <div
        className="w-full max-w-[420px] bg-white rounded-xl shadow-lg border-2 border-emerald-800 overflow-hidden relative text-slate-900 select-none print:shadow-none print:border-2 print:border-emerald-800"
        style={{ minHeight: '260px' }}
      >
        {/* Card Header with Green and Gold Bands */}
        <div className="bg-emerald-900 text-white px-4 py-2.5 border-b-2 border-amber-400 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PorseniEmblem size={40} className="shrink-0" />
              <div>
                <h3 className="text-[11px] font-extrabold tracking-wider leading-tight text-amber-300 uppercase">
                  KARTU TANDA PESERTA RESMI
                </h3>
                <h4 className="text-[9px] font-semibold text-white tracking-wide uppercase line-clamp-1">
                  {settings.namaPorseni} {settings.tahun}
                </h4>
                <p className="text-[8px] text-emerald-200">
                  {settings.namaPenyelenggara}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-amber-400 text-emerald-950 font-bold rounded">
                {peserta.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 grid grid-cols-12 gap-3 relative bg-gradient-to-b from-white via-white to-emerald-50/40">
          {/* Left Column: Photo & Barcode */}
          <div className="col-span-4 flex flex-col items-center justify-between">
            <div className="w-24 h-32 rounded-lg border-2 border-emerald-700 bg-slate-100 overflow-hidden shadow-xs flex items-center justify-center relative">
              {peserta.fotoUrl ? (
                <img
                  src={peserta.fotoUrl}
                  alt={peserta.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm mb-1">
                    {peserta.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">Pasfoto 3x4</span>
                </div>
              )}
            </div>

            {/* Micro Verification Stamp */}
            <div className="mt-2 text-center">
              <span className="text-[8px] font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 block">
                {peserta.nomorPeserta}
              </span>
            </div>
          </div>

          {/* Right Column: Participant Details */}
          <div className="col-span-8 flex flex-col justify-between">
            <div className="space-y-1.5 text-[10px]">
              <div>
                <span className="text-[8px] text-slate-500 font-medium block uppercase tracking-wider">
                  Nama Lengkap
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight block">
                  {peserta.nama}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-[8px] text-slate-500 font-medium block">NISN / NIS</span>
                  <span className="font-semibold text-slate-800 font-mono text-[9px]">
                    {peserta.nisn} / {peserta.nis}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-medium block">Jenis Kelamin</span>
                  <span className="font-semibold text-slate-800 text-[9px]">
                    {peserta.jenisKelamin === 'L' ? 'Laki-Laki (Putra)' : 'Perempuan (Putri)'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[8px] text-slate-500 font-medium block uppercase tracking-wider">
                  Lembaga Kontingen
                </span>
                <span className="font-semibold text-emerald-900 text-[10px] block line-clamp-1">
                  {lembaga?.nama || 'Kontingen Lembaga'}
                </span>
              </div>

              <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="text-[8px] text-emerald-700 font-medium block">Cabang Lomba & Kategori</span>
                <span className="font-bold text-emerald-950 text-[10px] block">
                  {cabang?.nama || 'Cabang Belum Ditentukan'}
                </span>
                <span className="text-[8px] text-slate-600 block">
                  Kategori: {peserta.kategoriLomba} · Tingkat: {peserta.tingkat}
                </span>
              </div>
            </div>

            {/* Bottom: QR Code & Signature Section */}
            <div className="flex items-end justify-between pt-2 border-t border-slate-200 mt-2">
              <div className="flex items-center gap-1.5">
                {qrCodeUrl && (
                  <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs">
                    <img src={qrCodeUrl} alt="QR Validasi" className="w-12 h-12" />
                  </div>
                )}
                <div className="text-[7px] text-slate-500 leading-tight max-w-[85px]">
                  Scan QR untuk validasi keaslian data kartu di portal resmi.
                </div>
              </div>

              <div className="text-center">
                <span className="text-[7px] text-slate-500 block">Panitia Pusat PORSENI</span>
                <div className="my-0.5 inline-block px-1.5 py-0.5 border border-dashed border-emerald-600 text-emerald-700 text-[7px] font-bold rounded">
                  [ TERSERTIFIKASI ]
                </div>
                <span className="text-[7px] font-bold text-slate-800 block underline">
                  Ketua Panitia Pelaksana
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Barcode Band */}
        <div className="bg-slate-100 px-3 py-1 border-t border-slate-200 flex items-center justify-between">
          <div className="w-1/2">
            <svg ref={barcodeSvgRef} className="w-full h-7"></svg>
          </div>
          <span className="text-[8px] text-slate-500 font-mono">
            ID: {peserta.id}
          </span>
        </div>
      </div>
    </div>
  );
};
