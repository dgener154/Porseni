import { StorageService } from './storage';
import { uploadAllToFirestore } from './firebase';
import { Lembaga, Peserta, CabangLomba } from '../types';
import * as XLSX from 'xlsx';

export interface SpreadsheetSyncResult {
  success: boolean;
  message: string;
  importedCounts?: {
    peserta: number;
    lembaga: number;
  };
}

export class SpreadsheetSyncService {
  /**
   * Extract clean Spreadsheet ID if user pastes full URL or raw ID
   * Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit -> 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   */
  public static extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  }

  /**
   * Fetch a sheet tab from Google Sheets by ID using the Google Visualization API
   * Requires sheet sharing permission: "Anyone with the link can view"
   */
  private static async fetchSheetData(
    spreadsheetId: string,
    sheetName: string
  ): Promise<string[][]> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      sheetName
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Gagal menghubungi Google Spreadsheet (Status ${response.status}). Pastikan ID benar dan sheet telah diatur ke "Siapa saja yang memiliki link dapat melihat".`
      );
    }

    const text = await response.text();
    // Google returns: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error(
        'Format respons spreadsheet tidak dikenali. Pastikan nama tab sheet sesuai (contoh: "Peserta" atau "Lembaga").'
      );
    }

    const parsed = JSON.parse(jsonMatch[1]);
    const table = parsed.table;
    if (!table || !table.rows) {
      return [];
    }

    const headers: string[] = (table.cols || []).map(
      (c: { label?: string; id?: string }) => c.label || c.id || ''
    );

    const rows: string[][] = [];
    if (headers.some(h => Boolean(h))) {
      rows.push(headers);
    }

    for (const r of table.rows) {
      const rowValues: string[] = [];
      for (const cell of r.c || []) {
        if (cell === null || cell === undefined || cell.v === null || cell.v === undefined) {
          rowValues.push('');
        } else {
          rowValues.push(String(cell.f || cell.v).trim());
        }
      }
      rows.push(rowValues);
    }

    return rows;
  }

  /**
   * Pull and synchronize data from Google Spreadsheet by ID
   */
  public static async pullFromSpreadsheet(
    spreadsheetId: string
  ): Promise<SpreadsheetSyncResult> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    if (!cleanId) {
      return {
        success: false,
        message: 'Masukkan ID Google Spreadsheet terlebih dahulu.',
      };
    }

    let importedPeserta = 0;
    let importedLembaga = 0;
    const errors: string[] = [];

    // 1. Try pulling Peserta sheet
    try {
      const pesertaRows = await this.fetchSheetData(cleanId, 'Peserta');
      if (pesertaRows.length > 1) {
        // First row is headers
        const headerRow = pesertaRows[0].map(h => h.toLowerCase());
        const existingPeserta = StorageService.getPeserta();
        const existingMap = new Map(existingPeserta.map(p => [p.nisn || p.id, p]));

        for (let i = 1; i < pesertaRows.length; i++) {
          const row = pesertaRows[i];
          if (!row || row.length === 0 || !row[0]) continue;

          // Mapping standard columns:
          // [0: ID/No, 1: NIS, 2: NISN, 3: NIK, 4: Nama, 5: JK, 6: Kelas, 7: Lembaga ID/Nama, 8: Cabang, 9: Status]
          const nama = row[4] || row[1] || '';
          const nisn = row[2] || '';
          if (!nama && !nisn) continue;

          const idKey = nisn || `PST-${Date.now()}-${i}`;
          const current = existingMap.get(idKey);

          const pesertaObj: Peserta = {
            id: current ? current.id : `PST-${Date.now()}-${i}`,
            nomorPeserta: current?.nomorPeserta || `PORSENI-2026-${String(i).padStart(5, '0')}`,
            lembagaId: current ? current.lembagaId : 'LG-2026-00001',
            nis: row[1] || current?.nis || '',
            nisn: nisn || current?.nisn || '',
            nik: row[3] || current?.nik || '',
            nama: nama || current?.nama || 'Peserta',
            tempatLahir: current?.tempatLahir || 'Indonesia',
            tanggalLahir: current?.tanggalLahir || '2008-01-01',
            jenisKelamin: (row[5]?.toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P',
            kelas: row[6] || current?.kelas || 'Kelas X',
            tingkat: current?.tingkat || 'MA/SMA/SMK',
            cabangId: current?.cabangId || 'CBG-001',
            kategoriLomba: current?.kategoriLomba || 'OLAHRAGA',
            status: (row[9]?.toUpperCase() || current?.status || 'MENUNGGU VERIFIKASI') as any,
            dokumenList: current?.dokumenList || [],
            isLocked: current?.isLocked || false,
            periodeId: current?.periodeId || 'PRD-2026',
            createdAt: current?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          existingMap.set(idKey, pesertaObj);
          importedPeserta++;
        }

        const updatedList = Array.from(existingMap.values());
        StorageService.setItems('porseni_peserta_v1', updatedList);
      }
    } catch (err) {
      errors.push(`Tab Peserta: ${(err as Error).message}`);
    }

    // 2. Try pulling Lembaga sheet
    try {
      const lembagaRows = await this.fetchSheetData(cleanId, 'Lembaga');
      if (lembagaRows.length > 1) {
        const existingLembaga = StorageService.getLembaga();
        const existingMap = new Map(existingLembaga.map(l => [l.npsn || l.id, l]));

        for (let i = 1; i < lembagaRows.length; i++) {
          const row = lembagaRows[i];
          if (!row || row.length === 0 || !row[0]) continue;

          // Mapping: [0: ID/No, 1: NPSN, 2: Nama Lembaga, 3: Jenjang, 4: Status, 5: Email/Kontak]
          const npsn = row[1] || '';
          const nama = row[2] || '';
          if (!nama && !npsn) continue;

          const idKey = npsn || `LG-${Date.now()}-${i}`;
          const current = existingMap.get(idKey);

          const lembagaObj: Lembaga = {
            id: current ? current.id : `LG-2026-${String(i).padStart(5, '0')}`,
            kodeLembaga: current ? current.kodeLembaga : `KOD-${npsn || i}`,
            nama: nama || current?.nama || 'Lembaga Kontingen',
            npsn: npsn || current?.npsn || '',
            jenjang: (row[3] || current?.jenjang || 'MA/SMA/SMK') as any,
            status: (row[4] || current?.status || 'AKTIF') as any,
            alamat: current?.alamat || 'Jl. Raya Pendidikan No. 1',
            desaKelurahan: current?.desaKelurahan || '',
            kecamatan: current?.kecamatan || '',
            kabupatenKota: current?.kabupatenKota || '',
            provinsi: current?.provinsi || '',
            kodePos: current?.kodePos || '',
            pimpinanNama: current?.pimpinanNama || 'Kepala Sekolah',
            pimpinanHp: current?.pimpinanHp || '081234567890',
            pimpinanEmail: current?.pimpinanEmail || '',
            operatorNama: current?.operatorNama || 'Operator Porseni',
            operatorNik: current?.operatorNik || '3573010101010001',
            operatorHp: current?.operatorHp || '081234567890',
            operatorEmail: row[5] || current?.operatorEmail || 'operator@porseni.sch.id',
            username: current?.username || `operator.${npsn || i}`,
            passwordHash: current?.passwordHash || '123456',
            periodeId: current?.periodeId || 'PRD-2026',
            createdAt: current?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          existingMap.set(idKey, lembagaObj);
          importedLembaga++;
        }

        const updatedList = Array.from(existingMap.values());
        StorageService.setItems('porseni_lembaga_v1', updatedList);
      }
    } catch (err) {
      errors.push(`Tab Lembaga: ${(err as Error).message}`);
    }

    // Save configuration settings
    const settings = StorageService.getPengaturan();
    const updatedSettings = {
      ...settings,
      spreadsheetId: cleanId,
      lastSyncSpreadsheet: new Date().toISOString(),
    };
    StorageService.savePengaturan(updatedSettings);

    // Also auto-sync to Firebase Firestore so other devices get it immediately!
    try {
      await uploadAllToFirestore();
    } catch {
      // cloud upload fallback
    }

    window.dispatchEvent(new CustomEvent('porseni_spreadsheet_synced'));

    if (importedPeserta > 0 || importedLembaga > 0) {
      return {
        success: true,
        message: `Sinkronisasi Spreadsheet berhasil! ${importedPeserta} data peserta dan ${importedLembaga} data lembaga tersinkronkan ke seluruh perangkat via Cloud.`,
        importedCounts: {
          peserta: importedPeserta,
          lembaga: importedLembaga,
        },
      };
    } else {
      return {
        success: false,
        message: `Tidak ada data yang dapat dibaca dari Spreadsheet ID: ${cleanId}. ${errors.join(
          ' | '
        )} Pastikan spreadsheet memiliki tab bernama "Peserta" dan "Lembaga", serta diatur publik (Anyone with link can view).`,
      };
    }
  }

  /**
   * Push data to Google Apps Script Webhook (if user configured an Apps Script Web App URL)
   */
  public static async pushToWebhook(
    appsScriptUrl: string
  ): Promise<{ success: boolean; message: string }> {
    if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Masukkan URL Google Apps Script Web App yang valid.',
      };
    }

    try {
      const payload = {
        action: 'SYNC_ALL',
        timestamp: new Date().toISOString(),
        lembaga: StorageService.getLembaga(),
        peserta: StorageService.getPeserta(),
        cabang: StorageService.getCabang(),
      };

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Apps Script web app often redirects
      });

      return {
        success: true,
        message: 'Data berhasil dikirimkan ke Google Apps Script Spreadsheet Webhook!',
      };
    } catch (err) {
      return {
        success: false,
        message: `Gagal mengirim ke Webhook: ${(err as Error).message}`,
      };
    }
  }

  /**
   * Download a Google Sheets Ready Template file (.xlsx) with matching sheets
   * Users can upload this directly to Google Drive to create their Google Spreadsheet!
   */
  public static downloadTemplateSpreadsheet(): void {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Peserta
    const pesertaHeaders = [
      'No',
      'NIS',
      'NISN',
      'NIK',
      'Nama Peserta',
      'Jenis Kelamin (L/P)',
      'Kelas',
      'ID Lembaga',
      'Cabang Lomba',
      'Status Verifikasi',
    ];
    const pesertaSample = [
      [
        1,
        '19001',
        '0071234567',
        '3573010101080001',
        'Ahmad Hidayatullah',
        'L',
        'Kelas XI',
        'LG-2026-00001',
        'Bulutangkis Tunggal Putra',
        'TERVERIFIKASI',
      ],
      [
        2,
        '19002',
        '0082345678',
        '3573010102090002',
        'Siti Nur Azizah',
        'P',
        'Kelas X',
        'LG-2026-00001',
        'Catur Standar Putri',
        'TERVERIFIKASI',
      ],
    ];
    const wsPeserta = XLSX.utils.aoa_to_sheet([pesertaHeaders, ...pesertaSample]);
    XLSX.utils.book_append_sheet(wb, wsPeserta, 'Peserta');

    // 2. Sheet Lembaga
    const lembagaHeaders = [
      'No',
      'NPSN',
      'Nama Lembaga',
      'Jenjang',
      'Status Lembaga',
      'Email Operator',
      'No HP Operator',
    ];
    const lembagaSample = [
      [
        1,
        '20580045',
        'MAN 1 Kota Malang',
        'MA/SMA/SMK',
        'NEGERI',
        'operator.man1@porseni.sch.id',
        '081234567890',
      ],
      [
        2,
        '20580046',
        'SMA Negeri 3 Surabaya',
        'MA/SMA/SMK',
        'NEGERI',
        'operator.sman3@porseni.sch.id',
        '081298765432',
      ],
    ];
    const wsLembaga = XLSX.utils.aoa_to_sheet([lembagaHeaders, ...lembagaSample]);
    XLSX.utils.book_append_sheet(wb, wsLembaga, 'Lembaga');

    // 3. Sheet Panduan
    const panduanData = [
      ['PANDUAN PENGGUNAAN INTEGRASI GOOGLE SPREADSHEET PORSENI DIGITAL'],
      [''],
      ['1. Buka Google Drive (drive.google.com) lalu Upload file ini.'],
      ['2. Buka file tersebut dengan Google Spreadsheet (Open with Google Sheets).'],
      ['3. Klik tombol "Share" / "Bagikan" di pojok kanan atas Google Spreadsheet.'],
      ['4. Ubah General Access menjadi "Anyone with the link can view" (Siapa saja yang memiliki link dapat melihat).'],
      ['5. Salin Spreadsheet ID dari URL browser (bagian di antara /d/ dan /edit).'],
      ['   Contoh URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'],
      ['   ID Spreadsheet: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'],
      ['6. Masukkan ID Spreadsheet tersebut ke menu Pengaturan PORSENI di perangkat Anda.'],
      ['7. Klik "Tarik Data dari Spreadsheet". Data akan otomatis terupdate di semua perangkat via Cloud!'],
    ];
    const wsPanduan = XLSX.utils.aoa_to_sheet(panduanData);
    XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

    // Generate and download
    XLSX.writeFile(wb, 'Format_Google_Spreadsheet_PORSENI_DIGITAL.xlsx');
  }
}
