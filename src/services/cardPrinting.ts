import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { AuthService } from './auth';
import { StorageService } from './storage';
import { Peserta, Lembaga, CabangLomba, PengaturanSistem } from '../types';

export const CARD_ACCESS_DENIED_MESSAGE =
  'Akses ditolak. Akun Pihak Lembaga hanya memiliki izin untuk melihat pratinjau kartu peserta.';

export class CardPrintingService {
  /**
   * Verifies if the authenticated session has permission to print or export cards.
   * Only ADMIN / Panitia Pusat has print & export permissions.
   * LEMBAGA only has view/preview permission.
   */
  public static validatePrintPermission(): { allowed: boolean; message?: string } {
    const session = AuthService.getSession();

    if (!session || !session.user) {
      return {
        allowed: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.',
      };
    }

    if (session.user.role === 'LEMBAGA') {
      // Record security audit log
      try {
        StorageService.addAuditLog({
          user: session.user.username,
          role: session.user.role,
          aktivitas: 'Percobaan Akses Cetak Ditolak',
          rincian: 'Pihak Lembaga mencoba memanggil fungsi cetak/ekspor kartu peserta.',
          ip: '127.0.0.1',
          status: 'GAGAL',
        });
      } catch {
        // ignore
      }

      return {
        allowed: false,
        message: CARD_ACCESS_DENIED_MESSAGE,
      };
    }

    if (session.user.role === 'ADMIN') {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: CARD_ACCESS_DENIED_MESSAGE,
    };
  }

  /**
   * Generates Barcode PNG Data URL using an offscreen canvas
   */
  public static generateBarcodeDataUrl(code: string): string {
    try {
      if (typeof document === 'undefined') return '';
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: 1.8,
        height: 36,
        displayValue: true,
        fontSize: 10,
        textMargin: 2,
        font: 'monospace',
        lineColor: '#0f172a',
        background: '#f8fafc',
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Gagal membuat barcode data URL', e);
      return '';
    }
  }

  /**
   * Generates QR Code PNG Data URL
   */
  public static async generateQrCodeDataUrl(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.warn('Gagal membuat QR code data URL', e);
      return '';
    }
  }

  /**
   * Get validation URL for participant
   */
  public static getValidationUrl(nomorPeserta: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://porseni.digital';
    return `${origin}/#validasi?id=${encodeURIComponent(nomorPeserta)}`;
  }

  /**
   * Export multiple cards into official A4 PDF (4 cards per page in 2x2 grid)
   */
  public static async exportBatchCardsPdf(pesertaIds: string[]): Promise<{ success: boolean; message: string; filename?: string }> {
    const check = this.validatePrintPermission();
    if (!check.allowed) {
      throw new Error(check.message || CARD_ACCESS_DENIED_MESSAGE);
    }

    if (!pesertaIds || pesertaIds.length === 0) {
      throw new Error('Pilih minimal satu kartu peserta untuk dicetak / diekspor.');
    }

    // Retrieve full peserta objects
    const allPeserta = StorageService.getPeserta();
    const allLembaga = StorageService.getLembaga();
    const allCabang = StorageService.getCabang();
    const settings = StorageService.getPengaturan();

    const selectedPeserta = allPeserta.filter(p => pesertaIds.includes(p.id));
    if (selectedPeserta.length === 0) {
      throw new Error('Data peserta tidak ditemukan.');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const CARDS_PER_PAGE = 4;
    const totalPages = Math.ceil(selectedPeserta.length / CARDS_PER_PAGE);

    // Positions for 2x2 grid on A4 (210 x 297 mm)
    // Card dimensions: 92mm width x 130mm height
    const cardPositions = [
      { x: 10, y: 14 },  // Top-left
      { x: 108, y: 14 }, // Top-right
      { x: 10, y: 151 }, // Bottom-left
      { x: 108, y: 151 },// Bottom-right
    ];

    for (let i = 0; i < selectedPeserta.length; i++) {
      const pageIndex = Math.floor(i / CARDS_PER_PAGE);
      const slotIndex = i % CARDS_PER_PAGE;

      if (slotIndex === 0 && i > 0) {
        doc.addPage();
      }

      const p = selectedPeserta[i];
      const pos = cardPositions[slotIndex];
      const lembaga = allLembaga.find(l => l.id === p.lembagaId);
      const cabang = allCabang.find(c => c.id === p.cabangId);

      await this.drawCardOnDoc(doc, pos.x, pos.y, p, lembaga, cabang, settings);

      // Draw cutting marks (crop guides) on page
      if (slotIndex === 3 || i === selectedPeserta.length - 1) {
        this.drawPageCropMarks(doc, pageIndex + 1, totalPages);
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Kartu_Peserta_PORSENI_${selectedPeserta.length}_Kartu_${dateStr}.pdf`;
    doc.save(filename);

    return {
      success: true,
      message: `Berhasil mengunduh dokumen PDF ${selectedPeserta.length} kartu peserta (${totalPages} lembar A4).`,
      filename,
    };
  }

  /**
   * Export single card into official PDF
   */
  public static async exportCardPdf(pesertaId: string): Promise<{ success: boolean; message: string; filename?: string }> {
    return await this.exportBatchCardsPdf([pesertaId]);
  }

  /**
   * Draws a single official PORSENI ID card at (x, y) with 92 x 130 mm dimensions
   */
  private static async drawCardOnDoc(
    doc: jsPDF,
    x: number,
    y: number,
    p: Peserta,
    lembaga?: Lembaga,
    cabang?: CabangLomba,
    settings?: PengaturanSistem
  ): Promise<void> {
    const cardW = 92;
    const cardH = 130;

    // 1. Card Outer Background & Border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(6, 78, 59); // Emerald 900
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

    // 2. Card Header Banner (Emerald 900)
    doc.setFillColor(6, 78, 59);
    doc.roundedRect(x + 0.3, y + 0.3, cardW - 0.6, 18, 2.2, 2.2, 'F');
    // Square off bottom of header
    doc.rect(x + 0.3, y + 10, cardW - 0.6, 8.3, 'F');

    // Gold stripe below header
    doc.setFillColor(251, 191, 36); // Amber 400
    doc.rect(x + 0.3, y + 18, cardW - 0.6, 1.4, 'F');

    // Header Typography
    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KARTU TANDA PESERTA RESMI', x + 4, y + 5.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    const eventName = `${settings?.namaPorseni || 'PORSENI'} ${settings?.tahun || new Date().getFullYear()}`;
    doc.text(eventName.toUpperCase(), x + 4, y + 10);

    doc.setTextColor(167, 243, 208); // Emerald 200
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    const penyelenggara = settings?.namaPenyelenggara || 'Panitia Pelaksana Pusat PORSENI';
    doc.text(penyelenggara.slice(0, 38), x + 4, y + 14);

    // Status Badge on Header
    doc.setFillColor(251, 191, 36);
    doc.roundedRect(x + cardW - 27, y + 3.5, 23, 4.5, 1, 1, 'F');
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text(p.status, x + cardW - 15.5, y + 6.8, { align: 'center' });

    // 3. Photo Box (Left column)
    const photoX = x + 4.5;
    const photoY = y + 23;
    const photoW = 24;
    const photoH = 32;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(0.4);
    doc.rect(photoX, photoY, photoW, photoH, 'FD');

    let photoRendered = false;
    if (p.fotoUrl && p.fotoUrl.startsWith('data:image')) {
      try {
        const format = p.fotoUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(p.fotoUrl, format, photoX, photoY, photoW, photoH);
        photoRendered = true;
      } catch (err) {
        console.warn('Could not embed photo data URL in PDF', err);
      }
    }

    if (!photoRendered) {
      // Draw stylized placeholder with initials
      doc.setFillColor(209, 250, 229);
      doc.circle(photoX + photoW / 2, photoY + 12, 6.5, 'F');
      doc.setTextColor(6, 78, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const initials = (p.nama || 'P').slice(0, 2).toUpperCase();
      doc.text(initials, photoX + photoW / 2, photoY + 14.5, { align: 'center' });

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text('PASFOTO 3X4', photoX + photoW / 2, photoY + 25, { align: 'center' });
    }

    // Micro Participant Number Stamp under Photo
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.2);
    doc.rect(photoX, photoY + photoH + 1.5, photoW, 4, 'FD');
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text(p.nomorPeserta, photoX + photoW / 2, photoY + photoH + 4.3, { align: 'center' });

    // 4. Participant Information (Right column)
    const infoX = x + 31.5;
    let currY = y + 24;

    // Nama Lengkap
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('NAMA LENGKAP', infoX, currY);

    currY += 4;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const splitName = doc.splitTextToSize(p.nama.toUpperCase(), 56);
    doc.text(splitName, infoX, currY);
    currY += (splitName.length * 4) + 1;

    // NISN / NIS & Gender in two columns
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('NISN / NIS', infoX, currY);
    doc.text('JENIS KELAMIN', infoX + 28, currY);

    currY += 3.2;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    const nisnText = `${p.nisn || '-'}${p.nis ? ' / ' + p.nis : ''}`;
    doc.text(nisnText.slice(0, 18), infoX, currY);
    const genderText = p.jenisKelamin === 'L' ? 'Laki-Laki (Putra)' : 'Perempuan (Putri)';
    doc.text(genderText, infoX + 28, currY);

    currY += 4.5;
    // Lembaga Kontingen
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('KONTINGEN LEMBAGA', infoX, currY);

    currY += 3.2;
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const lembagaName = (lembaga?.nama || 'Kontingen Lembaga').toUpperCase();
    const splitLembaga = doc.splitTextToSize(lembagaName, 56);
    doc.text(splitLembaga, infoX, currY);
    currY += (splitLembaga.length * 3.5) + 1.5;

    // Cabang Lomba Box
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(infoX, currY, 56, 11.5, 1.5, 1.5, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('CABANG LOMBA & KATEGORI', infoX + 2, currY + 3.2);

    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const cabangName = cabang?.nama || 'Cabang Belum Ditentukan';
    doc.text(cabangName.slice(0, 32), infoX + 2, currY + 6.8);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    const catText = `Kategori: ${p.kategoriLomba} · Tingkat: ${p.tingkat}`;
    doc.text(catText, infoX + 2, currY + 9.8);

    // 5. Verification Section (QR Code & Certification Stamp)
    const valY = y + 75;
    const qrValidationUrl = this.getValidationUrl(p.nomorPeserta);
    const qrDataUrl = await this.generateQrCodeDataUrl(qrValidationUrl);

    if (qrDataUrl) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(x + 4.5, valY, 19, 19, 'FD');
      doc.addImage(qrDataUrl, 'PNG', x + 5, valY + 0.5, 18, 18);
    }

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.text('Scan QR validasi resmi', x + 4.5, valY + 22);

    // Right side: Official Certification Stamp & Signature Box
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Panitia Pelaksana Pusat', x + cardW - 27, valY + 3, { align: 'center' });

    // Green Stamp Box [TERSERTIFIKASI]
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.3);
    doc.rect(x + cardW - 38, valY + 5.5, 24, 5, 'D');
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('[ TERSERTIFIKASI ]', x + cardW - 26, valY + 9, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('Ketua Panitia Pelaksana', x + cardW - 27, valY + 16, { align: 'center' });
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.2);
    doc.line(x + cardW - 39, valY + 17, x + cardW - 15, valY + 17);

    // 6. Footer Barcode Band
    const footerY = y + 105;
    const footerH = 24.5;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(x + 0.3, footerY, cardW - 0.6, footerH, 'FD');

    const barcodeDataUrl = this.generateBarcodeDataUrl(p.nomorPeserta);
    if (barcodeDataUrl) {
      doc.addImage(barcodeDataUrl, 'PNG', x + 5, footerY + 2, 52, 14);
    } else {
      doc.setTextColor(15, 23, 42);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text(p.nomorPeserta, x + 6, footerY + 10);
    }

    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.text(`ID: ${p.id}`, x + cardW - 4, footerY + 18.5, { align: 'right' });
    doc.text('PORSENI OFFICIAL SECURED ID', x + cardW - 4, footerY + 8, { align: 'right' });
  }

  /**
   * Draws crop marks & page numbering on A4 sheet
   */
  private static drawPageCropMarks(doc: jsPDF, currentPage: number, totalPages: number): void {
    doc.setDrawColor(148, 163, 184); // Slate 400
    doc.setLineWidth(0.15);

    // Center vertical cutting line guide
    doc.setLineDashPattern([2, 3], 0);
    doc.line(105, 5, 105, 292);

    // Center horizontal cutting line guide
    doc.line(4, 147.5, 206, 147.5);
    doc.setLineDashPattern([], 0); // Reset dash

    // Footer sheet info
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(
      `PORSENI DIGITAL · Lembar Cetak Kartu A4 (4 Kartu per Lembar) · Halaman ${currentPage} dari ${totalPages}`,
      105,
      294,
      { align: 'center' }
    );
  }

  /**
   * Print multiple cards cleanly using a dedicated isolated print iframe.
   * If the browser blocks print in iframe preview, falls back to automatic PDF download.
   */
  public static async printBatchCards(pesertaIds: string[]): Promise<{ success: boolean; message: string }> {
    const check = this.validatePrintPermission();
    if (!check.allowed) {
      throw new Error(check.message || CARD_ACCESS_DENIED_MESSAGE);
    }

    if (!pesertaIds || pesertaIds.length === 0) {
      throw new Error('Pilih minimal satu kartu peserta untuk dicetak.');
    }

    const allPeserta = StorageService.getPeserta();
    const allLembaga = StorageService.getLembaga();
    const allCabang = StorageService.getCabang();
    const settings = StorageService.getPengaturan();

    const selectedPeserta = allPeserta.filter(p => pesertaIds.includes(p.id));
    if (selectedPeserta.length === 0) {
      throw new Error('Data kartu peserta terpilih tidak ditemukan.');
    }

    // Try opening isolated print iframe
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Gagal mengakses print engine browser.');
      }

      // Generate HTML with precomputed QR and barcode data URLs
      const cardsHtmlPromises = selectedPeserta.map(async p => {
        const lembaga = allLembaga.find(l => l.id === p.lembagaId);
        const cabang = allCabang.find(c => c.id === p.cabangId);
        const qrUrl = this.getValidationUrl(p.nomorPeserta);
        const qrDataUrl = await this.generateQrCodeDataUrl(qrUrl);
        const barcodeDataUrl = this.generateBarcodeDataUrl(p.nomorPeserta);

        return `
          <div class="card-item">
            <div class="card-header">
              <div class="header-left">
                <div class="gold-title">KARTU TANDA PESERTA RESMI</div>
                <div class="event-title">${settings.namaPorseni} ${settings.tahun}</div>
                <div class="organizer-title">${settings.namaPenyelenggara}</div>
              </div>
              <div class="badge-status">${p.status}</div>
            </div>
            <div class="gold-stripe"></div>

            <div class="card-body">
              <div class="photo-col">
                <div class="photo-box">
                  ${p.fotoUrl ? `<img src="${p.fotoUrl}" class="photo-img" />` : `<div class="initials-box">${(p.nama || 'P').substring(0, 2).toUpperCase()}</div><span class="photo-label">Pasfoto 3x4</span>`}
                </div>
                <div class="micro-stamp">${p.nomorPeserta}</div>
              </div>

              <div class="info-col">
                <div class="field-label">NAMA LENGKAP</div>
                <div class="field-name">${p.nama.toUpperCase()}</div>

                <div class="row-two">
                  <div>
                    <div class="field-label">NISN / NIS</div>
                    <div class="field-val">${p.nisn || '-'} / ${p.nis || '-'}</div>
                  </div>
                  <div>
                    <div class="field-label">JENIS KELAMIN</div>
                    <div class="field-val">${p.jenisKelamin === 'L' ? 'Laki-Laki (Putra)' : 'Perempuan (Putri)'}</div>
                  </div>
                </div>

                <div class="field-label">KONTINGEN LEMBAGA</div>
                <div class="field-lembaga">${lembaga?.nama || 'Kontingen Lembaga'}</div>

                <div class="cabang-box">
                  <div class="cabang-lbl">CABANG LOMBA & KATEGORI</div>
                  <div class="cabang-val">${cabang?.nama || 'Cabang Belum Ditentukan'}</div>
                  <div class="cabang-sub">Kategori: ${p.kategoriLomba} · Tingkat: ${p.tingkat}</div>
                </div>

                <div class="cert-row">
                  <div class="qr-box">
                    <img src="${qrDataUrl}" class="qr-img" />
                    <div class="qr-caption">Scan validasi</div>
                  </div>
                  <div class="stamp-box">
                    <div class="stamp-lbl">Panitia Pusat PORSENI</div>
                    <div class="stamp-badge">[ TERSERTIFIKASI ]</div>
                    <div class="stamp-sign">Ketua Panitia Pelaksana</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <img src="${barcodeDataUrl}" class="barcode-img" />
              <div class="id-tag">ID: ${p.id}</div>
            </div>
          </div>
        `;
      });

      const cardsHtmlArray = await Promise.all(cardsHtmlPromises);

      // Group 4 cards per A4 page container
      let pagesHtml = '';
      for (let i = 0; i < cardsHtmlArray.length; i += 4) {
        const pageCards = cardsHtmlArray.slice(i, i + 4).join('');
        pagesHtml += `
          <div class="page-sheet">
            <div class="grid-2x2">
              ${pageCards}
            </div>
            <div class="page-footer-note">PORSENI DIGITAL · Lembar Cetak Kartu A4 Resmi</div>
          </div>
        `;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Kartu Peserta PORSENI</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #0f172a;
            }
            .page-sheet {
              width: 194mm;
              height: 281mm;
              margin: 0 auto;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
            }
            .grid-2x2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-gap: 8mm;
              padding-top: 4mm;
            }
            .card-item {
              width: 93mm;
              height: 133mm;
              border: 2px solid #064e3b;
              border-radius: 8px;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-shadow: none;
            }
            .card-header {
              background: #064e3b;
              color: #ffffff;
              padding: 8px 10px 4px 10px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .gold-title {
              font-size: 8px;
              font-weight: 800;
              color: #fbbf24;
              letter-spacing: 0.5px;
            }
            .event-title {
              font-size: 9px;
              font-weight: 800;
              color: #ffffff;
              line-height: 1.1;
            }
            .organizer-title {
              font-size: 6.5px;
              color: #a7f3d0;
            }
            .badge-status {
              background: #fbbf24;
              color: #064e3b;
              font-size: 6.5px;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 3px;
            }
            .gold-stripe {
              height: 3px;
              background: #fbbf24;
              width: 100%;
            }
            .card-body {
              padding: 8px;
              display: grid;
              grid-template-columns: 75px 1fr;
              grid-gap: 8px;
              flex: 1;
            }
            .photo-col {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .photo-box {
              width: 72px;
              height: 96px;
              border: 1.5px solid #064e3b;
              border-radius: 5px;
              background: #f8fafc;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .photo-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .initials-box {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #d1fae5;
              color: #064e3b;
              font-weight: 800;
              font-size: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 4px;
            }
            .photo-label {
              font-size: 7.5px;
              color: #64748b;
            }
            .micro-stamp {
              margin-top: 5px;
              background: #ecfdf5;
              border: 1px solid #10b981;
              color: #064e3b;
              font-size: 7px;
              font-weight: 700;
              padding: 2px 4px;
              border-radius: 3px;
              text-align: center;
              width: 100%;
            }
            .info-col {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .field-label {
              font-size: 6px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
            .field-name {
              font-size: 9px;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.2;
              margin-bottom: 3px;
            }
            .row-two {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-gap: 4px;
              margin-bottom: 3px;
            }
            .field-val {
              font-size: 7.5px;
              font-weight: 700;
              color: #1e293b;
            }
            .field-lembaga {
              font-size: 8px;
              font-weight: 700;
              color: #064e3b;
              line-height: 1.2;
              margin-bottom: 3px;
            }
            .cabang-box {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              border-radius: 4px;
              padding: 4px 6px;
              margin-bottom: 4px;
            }
            .cabang-lbl {
              font-size: 5.5px;
              color: #065f46;
              font-weight: 700;
            }
            .cabang-val {
              font-size: 7.5px;
              font-weight: 800;
              color: #064e3b;
            }
            .cabang-sub {
              font-size: 6px;
              color: #475569;
            }
            .cert-row {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 3px;
            }
            .qr-box {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-img {
              width: 44px;
              height: 44px;
              border: 1px solid #cbd5e1;
              border-radius: 3px;
              padding: 1px;
              background: #ffffff;
            }
            .qr-caption {
              font-size: 5.5px;
              color: #64748b;
              margin-top: 1px;
            }
            .stamp-box {
              text-align: center;
            }
            .stamp-lbl {
              font-size: 6px;
              color: #475569;
            }
            .stamp-badge {
              font-size: 6.5px;
              font-weight: 800;
              color: #059669;
              border: 1px dashed #059669;
              padding: 1px 4px;
              border-radius: 2px;
              margin: 2px 0;
            }
            .stamp-sign {
              font-size: 6px;
              font-weight: 700;
              color: #0f172a;
              text-decoration: underline;
            }
            .card-footer {
              background: #f1f5f9;
              border-top: 1px solid #e2e8f0;
              padding: 3px 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .barcode-img {
              height: 22px;
              width: auto;
            }
            .id-tag {
              font-size: 6.5px;
              font-family: monospace;
              color: #64748b;
            }
            .page-footer-note {
              font-size: 7px;
              color: #94a3b8;
              text-align: center;
              padding-bottom: 2mm;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `);
      iframeDoc.close();

      // Trigger print after iframe renders
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 3000);
        } catch (printErr) {
          console.warn('Iframe print intercepted, fallback to direct PDF export', printErr);
          document.body.removeChild(printIframe);
          this.exportBatchCardsPdf(pesertaIds);
        }
      }, 500);

      return {
        success: true,
        message: `Menyiapkan cetak untuk ${selectedPeserta.length} kartu peserta...`,
      };
    } catch (e: any) {
      console.warn('Browser print failed, fallback to PDF download', e);
      // Automatic fallback to PDF generator
      const pdfResult = await this.exportBatchCardsPdf(pesertaIds);
      return {
        success: true,
        message: `Dialog cetak browser dibatasi. File PDF resmi (${pdfResult.filename}) telah otomatis diunduh!`,
      };
    }
  }

  /**
   * Print single card
   */
  public static async printSingleCard(pesertaId: string): Promise<{ success: boolean; message: string }> {
    return await this.printBatchCards([pesertaId]);
  }
}

// Expose globally for console testing
if (typeof window !== 'undefined') {
  (window as any).CardPrintingService = CardPrintingService;
}
