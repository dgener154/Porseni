import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  ShadingType,
} from 'docx';
import { CabangLomba, Lembaga, Peserta, PengaturanSistem } from '../types';
import { AuthService } from './auth';
import { StorageService } from './storage';

export class ReportExportService {
  /**
   * Validates access permissions before exporting
   * Pihak Lembaga can only export their own kontingen data.
   */
  public static validateExportAccess(targetLembagaId: string): { allowed: boolean; message?: string } {
    const session = AuthService.getSession();
    if (!session || !session.user) {
      return { allowed: false, message: 'Akses ditolak. Silakan masuk terlebih dahulu.' };
    }

    if (session.user.role === 'LEMBAGA') {
      if (session.user.lembagaId && session.user.lembagaId !== targetLembagaId) {
        StorageService.addAuditLog({
          user: session.user.username,
          role: session.user.role,
          aktivitas: 'Pelanggaran Izin Ekspor Data',
          rincian: `Mencoba mengekspor data kontingen lain (${targetLembagaId}).`,
          ip: '127.0.0.1',
          status: 'GAGAL',
        });
        return {
          allowed: false,
          message: 'Akses ditolak. Anda hanya berhak mengekspor data kontingen lembaga Anda sendiri.',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Helper to download a Blob as a file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Generate sanitized filename: Rekap_Kontingen_NamaLembaga_Tanggal.ext
   */
  private static getFilename(lembagaNama: string, ext: 'pdf' | 'docx'): string {
    const cleanLembaga = lembagaNama.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    return `Rekap_Kontingen_${cleanLembaga}_${dateStr}.${ext}`;
  }

  /**
   * EXPORT TO PDF (.pdf)
   * Uses jsPDF + autoTable with A4 landscape orientation for optimal column readability
   */
  public static async exportRekapPdf(
    lembaga: Lembaga,
    pesertaList: Peserta[],
    cabangList: CabangLomba[],
    pengaturan?: PengaturanSistem
  ): Promise<{ success: boolean; message: string }> {
    const check = this.validateExportAccess(lembaga.id);
    if (!check.allowed) {
      throw new Error(check.message);
    }

    const settings = pengaturan || StorageService.getPengaturan();
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Create jsPDF in landscape A4
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header & Title (Formal Kop Laporan)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('DAFTAR REKAPITULASI PESERTA PEKAN OLAHRAGA DAN SENI (PORSENI)', pageWidth / 2, 16, {
      align: 'center',
    });

    doc.setFontSize(11);
    doc.text(`KONTINGEN: ${lembaga.nama.toUpperCase()} (${lembaga.id})`, pageWidth / 2, 22, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const subheader = `NPSN: ${lembaga.npsn || '-'}  ·  Alamat: ${lembaga.alamat || '-'}, ${
      lembaga.kabupatenKota || '-'
    }, Prov. ${lembaga.provinsi || '-'}`;
    doc.text(subheader, pageWidth / 2, 27, { align: 'center' });

    // Decorative line
    doc.setDrawColor(6, 78, 59); // Emerald 900
    doc.setLineWidth(0.8);
    doc.line(14, 30, pageWidth - 14, 30);
    doc.setLineWidth(0.2);
    doc.line(14, 31, pageWidth - 14, 31);
    doc.setTextColor(0, 0, 0);

    // 2. Table Data
    const tableHeaders = [
      ['NO', 'NOMOR PESERTA', 'NAMA LENGKAP', 'NISN / NIK', 'JK', 'CABANG LOMBA', 'KATEGORI', 'STATUS'],
    ];

    const tableBody = pesertaList.map((p, idx) => {
      const cabang = cabangList.find(c => c.id === p.cabangId);
      return [
        (idx + 1).toString(),
        p.nomorPeserta,
        p.nama,
        `${p.nisn || '-'} / ${p.nik || '-'}`,
        p.jenisKelamin,
        cabang?.nama || p.cabangId || '-',
        p.kategoriLomba,
        p.status,
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableBody,
      startY: 34,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        textColor: [20, 20, 20],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [6, 78, 59], // Emerald 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 32 },
        2: { halign: 'left', cellWidth: 55 },
        3: { halign: 'center', cellWidth: 42 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'left', cellWidth: 45 },
        6: { halign: 'center', cellWidth: 26 },
        7: { halign: 'center', cellWidth: 38 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: data => {
        // Footer page numbering
        const pageCount = (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount} · ${settings.namaPorseni} ${settings.tahun}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      },
    });

    // 3. Signature Section at bottom of document
    const finalY = (doc as any).lastAutoTable.finalY || 140;
    const pageHeight = doc.internal.pageSize.getHeight();
    let signY = finalY + 12;

    // Check if enough space for signatures on current page, else add page
    if (signY + 40 > pageHeight) {
      doc.addPage();
      signY = 25;
    }

    const leftColX = 35;
    const rightColX = pageWidth - 65;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Left Signature: Kepala Lembaga
    doc.text('Mengetahui,', leftColX, signY, { align: 'center' });
    doc.text('Kepala Lembaga / Pimpinan Kontingen', leftColX, signY + 5, { align: 'center' });

    // Right Signature: Operator Kontingen
    doc.text(`${lembaga.kabupatenKota || 'Kota'}, ${todayFormatted}`, rightColX, signY, {
      align: 'center',
    });
    doc.text('Petugas Operator Kontingen', rightColX, signY + 5, { align: 'center' });

    // Signature names (with underline)
    doc.setFont('helvetica', 'bold');
    doc.text(lembaga.pimpinanNama || '__________________________', leftColX, signY + 28, {
      align: 'center',
    });
    doc.text(lembaga.operatorNama || '__________________________', rightColX, signY + 28, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      lembaga.pimpinanNip ? `NIP. ${lembaga.pimpinanNip}` : 'Pimpinan Satuan Pendidikan',
      leftColX,
      signY + 33,
      { align: 'center' }
    );
    doc.text(lembaga.operatorNik ? `NIK: ${lembaga.operatorNik}` : 'Petugas Kontingen', rightColX, signY + 33, {
      align: 'center',
    });

    // Save/Download PDF file
    const filename = this.getFilename(lembaga.nama, 'pdf');
    doc.save(filename);

    StorageService.addAuditLog({
      user: lembaga.operatorNama || 'OPERATOR',
      role: 'LEMBAGA',
      aktivitas: 'Ekspor Rekapitulasi PDF',
      rincian: `Berhasil mengunduh dokumen ${filename} (${pesertaList.length} peserta)`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return {
      success: true,
      message: `File PDF "${filename}" berhasil dibuat dan diunduh.`,
    };
  }

  /**
   * EXPORT TO WORD (.docx)
   * Generates genuine Microsoft Word table document with formal styles and signatures
   */
  public static async exportRekapWord(
    lembaga: Lembaga,
    pesertaList: Peserta[],
    cabangList: CabangLomba[],
    pengaturan?: PengaturanSistem
  ): Promise<{ success: boolean; message: string }> {
    const check = this.validateExportAccess(lembaga.id);
    if (!check.allowed) {
      throw new Error(check.message);
    }

    const settings = pengaturan || StorageService.getPengaturan();
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Create table header row
    const headers = ['NO', 'NOMOR PESERTA', 'NAMA LENGKAP', 'NISN / NIK', 'JK', 'CABANG LOMBA', 'KATEGORI', 'STATUS'];
    const colWidths = [600, 1800, 2800, 2000, 600, 2200, 1400, 1800]; // total ~ 13,200 dxa (fits landscape)

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (text, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: '064E3B' }, // Emerald 900
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    color: 'FFFFFF',
                    size: 16, // 8pt
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          })
      ),
    });

    // Create table body rows
    const bodyRows = pesertaList.map((p, idx) => {
      const cabang = cabangList.find(c => c.id === p.cabangId);
      const isEven = idx % 2 === 1;
      const fill = isEven ? 'F8FAFC' : 'FFFFFF';

      const rowValues = [
        (idx + 1).toString(),
        p.nomorPeserta,
        p.nama,
        `${p.nisn || '-'} / ${p.nik || '-'}`,
        p.jenisKelamin,
        cabang?.nama || p.cabangId || '-',
        p.kategoriLomba,
        p.status,
      ];

      return new TableRow({
        children: rowValues.map(
          (val, i) =>
            new TableCell({
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill },
              children: [
                new Paragraph({
                  alignment: i === 1 || i === 2 || i === 5 ? AlignmentType.LEFT : AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: val,
                      bold: i === 1 || i === 2,
                      color: i === 1 ? '064E3B' : '1E293B',
                      size: 16, // 8pt
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            })
        ),
      });
    });

    const dataTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
    });

    // Create Signature Table (2 columns: left Pimpinan, right Operator)
    const signatureTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mengetahui,', size: 18, font: 'Calibri' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Kepala Lembaga / Pimpinan Kontingen',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({ text: '', spacing: { before: 800, after: 0 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: lembaga.pimpinanNama || '__________________________',
                      bold: true,
                      underline: {},
                      size: 18,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: lembaga.pimpinanNip ? `NIP. ${lembaga.pimpinanNip}` : 'Pimpinan Satuan Pendidikan',
                      size: 16,
                      font: 'Calibri',
                      color: '64748B',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${lembaga.kabupatenKota || 'Kota'}, ${todayFormatted}`,
                      size: 18,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Petugas Operator Kontingen',
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({ text: '', spacing: { before: 800, after: 0 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: lembaga.operatorNama || '__________________________',
                      bold: true,
                      underline: {},
                      size: 18,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: lembaga.operatorNik ? `NIK: ${lembaga.operatorNik}` : 'Petugas Kontingen',
                      size: 16,
                      font: 'Calibri',
                      color: '64748B',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // Build the Word document in Landscape
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'DAFTAR REKAPITULASI PESERTA PEKAN OLAHRAGA DAN SENI (PORSENI)',
                  bold: true,
                  size: 24, // 12pt
                  color: '064E3B',
                  font: 'Calibri',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `KONTINGEN: ${lembaga.nama.toUpperCase()} (${lembaga.id})`,
                  bold: true,
                  size: 20, // 10pt
                  color: '1E293B',
                  font: 'Calibri',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `NPSN: ${lembaga.npsn || '-'} · ${lembaga.alamat || '-'}, ${lembaga.kabupatenKota || '-'}, Prov. ${
                    lembaga.provinsi || '-'
                  }`,
                  size: 16, // 8pt
                  color: '64748B',
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 200 },
            }),
            dataTable,
            new Paragraph({ text: '', spacing: { before: 400, after: 0 } }),
            signatureTable,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = this.getFilename(lembaga.nama, 'docx');
    this.downloadBlob(blob, filename);

    StorageService.addAuditLog({
      user: lembaga.operatorNama || 'OPERATOR',
      role: 'LEMBAGA',
      aktivitas: 'Ekspor Rekapitulasi Word',
      rincian: `Berhasil mengunduh dokumen ${filename} (${pesertaList.length} peserta)`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return {
      success: true,
      message: `File Word (.docx) "${filename}" berhasil dibuat dan diunduh.`,
    };
  }
}
