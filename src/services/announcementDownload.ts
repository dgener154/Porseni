import { Pengumuman } from '../types';

/**
 * Downloads the attachment file associated with an announcement.
 * Supports Base64 data URLs, remote URLs, and generates official structured .doc/.pdf documents
 * when only a filename is provided.
 */
export function downloadAnnouncementAttachment(
  ann: Pengumuman,
  namaWebsite = 'PORSENI DIGITAL',
  tahun = '2026'
): void {
  // 1. Data URL attachment (uploaded directly by admin)
  if (ann.lampiranUrl && ann.lampiranUrl.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = ann.lampiranUrl;
    a.download = ann.lampiranNama || `Lampiran_${ann.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Remote URL attachment (Google Drive, Cloud storage, etc.)
  if (ann.lampiranUrl && ann.lampiranUrl.startsWith('http') && ann.lampiranUrl !== '#') {
    window.open(ann.lampiranUrl, '_blank');
    return;
  }

  // 3. Generate official structured document file (.doc) that opens in Word, LibreOffice, and mobile viewers
  const safeTitle = ann.judul.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  const fileName = ann.lampiranNama && ann.lampiranNama.trim()
    ? ann.lampiranNama.trim()
    : `Surat_Edaran_${ann.id}_${safeTitle}.doc`;

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${ann.judul}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; margin: 0; }
    .header { text-align: center; border-bottom: 3px double #047857; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 18px; margin: 0; color: #047857; text-transform: uppercase; font-weight: 800; }
    .header h2 { font-size: 13px; margin: 4px 0; color: #0f172a; text-transform: uppercase; }
    .header p { font-size: 11px; margin: 2px 0; color: #64748b; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; }
    .meta-box table { width: 100%; border-collapse: collapse; }
    .meta-box td { padding: 4px 0; }
    .meta-box td.label { width: 150px; font-weight: bold; color: #475569; }
    .title-banner { background: #ecfdf5; border-left: 4px solid #059669; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; }
    .title-banner h3 { margin: 0; font-size: 15px; color: #065f46; font-weight: bold; }
    .content { font-size: 13px; color: #334155; white-space: pre-line; line-height: 1.8; margin-bottom: 35px; }
    .footer-sign { width: 100%; margin-top: 40px; font-size: 12px; }
    .signature { float: right; width: 260px; text-align: center; }
    .signature .stamp { color: #059669; font-weight: bold; margin: 15px 0; border: 2px dashed #059669; padding: 8px; border-radius: 6px; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PANITIA PELAKSANA PEKAN OLAHRAGA DAN SENI (PORSENI)</h1>
    <h2>${namaWebsite.toUpperCase()} TAHUN ${tahun}</h2>
    <p>Sekretariat Pusat Penyelenggara · Sistem Informasi Resmi PORSENI Digital</p>
  </div>

  <div class="meta-box">
    <table>
      <tr>
        <td class="label">Nomor / ID Surat:</td>
        <td><strong>${ann.id}</strong></td>
      </tr>
      <tr>
        <td class="label">Kategori Informasi:</td>
        <td><span class="badge">${ann.kategori}</span></td>
      </tr>
      <tr>
        <td class="label">Tanggal Terbit:</td>
        <td>${ann.tanggal}</td>
      </tr>
      <tr>
        <td class="label">Nama Berkas:</td>
        <td><strong>${fileName}</strong></td>
      </tr>
    </table>
  </div>

  <div class="title-banner">
    <h3>${ann.judul}</h3>
  </div>

  <div class="content">
${ann.isi}
  </div>

  <div class="footer-sign">
    <div class="signature">
      <p>Ditetapkan di Sekretariat Pusat</p>
      <p>Pada tanggal: ${ann.tanggal}</p>
      <div class="stamp">
        TERVERIFIKASI RESMI<br/>
        PANITIA PORSENI DIGITAL
      </div>
      <p><strong>Panitia Pelaksana PORSENI</strong></p>
    </div>
    <div style="clear: both;"></div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileName.endsWith('.pdf')
    ? fileName
    : `${fileName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-friendly document dialog allowing users to print or save the announcement as PDF.
 */
export function printAnnouncementDocument(
  ann: Pengumuman,
  namaWebsite = 'PORSENI DIGITAL',
  tahun = '2026'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${ann.judul} - ${namaWebsite}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; padding: 25px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #047857; padding-bottom: 14px; margin-bottom: 24px; }
        .header h1 { font-size: 17px; margin: 0; color: #065f46; font-weight: 800; letter-spacing: 0.5px; }
        .header h2 { font-size: 13px; margin: 4px 0; color: #334155; }
        .header p { font-size: 10px; margin: 2px 0; color: #64748b; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
        .meta-table td { padding: 6px 12px; }
        .meta-table td.label { width: 150px; font-weight: bold; color: #475569; }
        .title { font-size: 15px; font-weight: 800; color: #065f46; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
        .body-text { font-size: 12px; color: #1e293b; white-space: pre-line; line-height: 1.8; text-align: justify; margin-bottom: 40px; }
        .signature-area { width: 100%; margin-top: 30px; }
        .signature-box { width: 240px; text-align: center; font-size: 11px; float: right; }
        .signature-stamp { margin: 12px auto; border: 2px dashed #059669; color: #059669; padding: 8px; font-weight: bold; font-size: 10px; border-radius: 6px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PANITIA PELAKSANA PEKAN OLAHRAGA DAN SENI (PORSENI)</h1>
        <h2>${namaWebsite.toUpperCase()} TAHUN ${tahun}</h2>
        <p>Sekretariat Pusat Penyelenggara · Salinan Surat Edaran Resmi</p>
      </div>

      <table class="meta-table">
        <tr>
          <td class="label">Nomor Pengumuman:</td>
          <td><strong>${ann.id}</strong></td>
        </tr>
        <tr>
          <td class="label">Kategori / Sifat:</td>
          <td><strong>${ann.kategori}</strong></td>
        </tr>
        <tr>
          <td class="label">Tanggal Terbit:</td>
          <td>${ann.tanggal}</td>
        </tr>
        <tr>
          <td class="label">Lampiran Berkas:</td>
          <td>${ann.lampiranNama || 'Dokumen Petunjuk Pelaksanaan'}</td>
        </tr>
      </table>

      <h3 class="title">${ann.judul}</h3>

      <div class="body-text">
${ann.isi}
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <p>Ditetapkan di Sekretariat Pusat</p>
          <p>Tanggal: ${ann.tanggal}</p>
          <div class="signature-stamp">
            SAH & TERVERIFIKASI<br/>
            PANITIA PORSENI DIGITAL
          </div>
          <p><strong>Panitia Pelaksana PORSENI</strong></p>
        </div>
        <div style="clear: both;"></div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
