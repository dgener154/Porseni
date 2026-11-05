import * as XLSX from 'xlsx';
import { CabangLomba, Peserta, PesertaStatus } from '../types';
import { StorageService } from './storage';
import { getOpsiKelasByJenjang } from '../utils/jenjangHelper';

export interface ExcelImportRow {
  rowNumber: number;
  nis: string;
  nisn: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: 'L' | 'P';
  kelas: string;
  tingkat: string;
  cabangNamaOrKode: string;
  kategori: 'OLAHRAGA' | 'SENI';
  pembimbingNama?: string;
  pembimbingHp?: string;
  isValid: boolean;
  errors: string[];
  matchedCabangId?: string;
}

export class ExcelService {
  // Generate & Download Template
  public static downloadPesertaTemplate(): void {
    const headers = [
      'NIS',
      'NISN',
      'NIK',
      'Nama Peserta',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Jenis Kelamin (L/P)',
      'Kelas',
      'Tingkat (MI/SD, MTs/SMP, MA/SMA/SMK)',
      'Cabang Lomba (Kode atau Nama)',
      'Kategori (OLAHRAGA / SENI)',
      'Nama Pembimbing',
      'No HP Pembimbing',
    ];

    const sampleRows = [
      [
        '19001',
        '0071234567',
        '3573010101080001',
        'Ahmad Hidayatullah',
        'Malang',
        '2008-03-12',
        'L',
        'XI IPA 1',
        'MA/SMA/SMK',
        'Bulutangkis Tunggal Putra',
        'OLAHRAGA',
        'Drs. Subagyo',
        '081234567890',
      ],
      [
        '19002',
        '0079876543',
        '3573010202080002',
        'Siti Aisyah Rahma',
        'Surabaya',
        '2008-07-21',
        'P',
        'XI Agama 2',
        'MA/SMA/SMK',
        'Musabaqah Tilawatil Qur\'an (MTQ) Putri',
        'SENI',
        'Ust. Fauzan, M.Pd.',
        '081398765432',
      ],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
      { wch: 12 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');
    XLSX.writeFile(wb, 'Template_Pendaftaran_Peserta_PORSENI.xlsx');
  }

  // Parse and validate uploaded Excel file
  public static async parsePesertaExcel(
    file: File,
    lembagaId: string
  ): Promise<{
    rows: ExcelImportRow[];
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  }> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];

    // Read rows as array of arrays
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rawData.length <= 1) {
      throw new Error('File Excel tidak memiliki baris data atau kosong.');
    }

    const availableCabang = StorageService.getCabang();
    const existingPeserta = StorageService.getPeserta();
    const existingNis = new Set(existingPeserta.map(p => p.nis.trim().toLowerCase()));
    const existingNisn = new Set(existingPeserta.map(p => p.nisn.trim().toLowerCase()));
    const existingNik = new Set(existingPeserta.map(p => p.nik.trim().toLowerCase()));

    // Track duplicates within the uploaded file itself
    const batchNis = new Set<string>();
    const batchNisn = new Set<string>();
    const batchNik = new Set<string>();

    const rows: ExcelImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    // Start parsing from index 1 (skip header)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      // Skip completely empty rows
      if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        continue;
      }

      const rowNum = i + 1;
      const errors: string[] = [];
      let isDuplicate = false;

      const nis = String(row[0] || '').trim();
      const nisn = String(row[1] || '').trim();
      const nik = String(row[2] || '').trim();
      const nama = String(row[3] || '').trim();
      const tempatLahir = String(row[4] || '').trim();
      let tanggalLahir = String(row[5] || '').trim();
      const jkRaw = String(row[6] || '').trim().toUpperCase();
      const jenisKelamin = jkRaw === 'P' || jkRaw.includes('PEREMPUAN') ? 'P' : 'L';
      const kelas = String(row[7] || '').trim();
      const tingkat = String(row[8] || 'MA/SMA/SMK').trim();
      const cabangInput = String(row[9] || '').trim();
      const kategoriRaw = String(row[10] || '').trim().toUpperCase();
      const kategori = kategoriRaw.includes('SENI') ? 'SENI' : 'OLAHRAGA';
      const pembimbingNama = row[11] ? String(row[11]).trim() : undefined;
      const pembimbingHp = row[12] ? String(row[12]).trim() : undefined;

      // 1. Mandatory Fields Validation
      if (!nama) errors.push('Nama peserta wajib diisi.');
      if (!nis) errors.push('NIS wajib diisi.');
      if (!nisn) errors.push('NISN wajib diisi.');
      if (!nik) errors.push('NIK wajib diisi.');
      if (!tempatLahir) errors.push('Tempat lahir wajib diisi.');
      if (!tanggalLahir) errors.push('Tanggal lahir wajib diisi.');

      // Check date format (supports YYYY-MM-DD or excel date serial)
      if (typeof row[5] === 'number') {
        const d = XLSX.SSF.parse_date_code(row[5]);
        tanggalLahir = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
        errors.push('Format tanggal lahir harus YYYY-MM-DD (contoh: 2008-05-15).');
      }

      // Check NISN format (10 digits)
      if (nisn && !/^\d{10}$/.test(nisn)) {
        errors.push('NISN harus terdiri dari 10 digit angka.');
      }
      // Check NIK format (16 digits)
      if (nik && !/^\d{16}$/.test(nik)) {
        errors.push('NIK harus terdiri dari 16 digit angka.');
      }

      // 2. Duplication Checks
      if (nis) {
        const nisKey = nis.toLowerCase();
        if (existingNis.has(nisKey) || batchNis.has(nisKey)) {
          errors.push(`NIS ${nis} sudah terdaftar dalam sistem atau terduplikasi dalam file.`);
          isDuplicate = true;
        }
        batchNis.add(nisKey);
      }

      if (nisn) {
        const nisnKey = nisn.toLowerCase();
        if (existingNisn.has(nisnKey) || batchNisn.has(nisnKey)) {
          errors.push(`NISN ${nisn} sudah terdaftar atau terduplikasi.`);
          isDuplicate = true;
        }
        batchNisn.add(nisnKey);
      }

      if (nik) {
        const nikKey = nik.toLowerCase();
        if (existingNik.has(nikKey) || batchNik.has(nikKey)) {
          errors.push(`NIK ${nik} sudah terdaftar atau terduplikasi.`);
          isDuplicate = true;
        }
        batchNik.add(nikKey);
      }

      // 3. Match Cabang Lomba
      let matchedCabang: CabangLomba | undefined;
      if (cabangInput) {
        const lowerInput = cabangInput.toLowerCase();
        matchedCabang = availableCabang.find(
          c =>
            c.nama.toLowerCase().includes(lowerInput) ||
            c.kode.toLowerCase() === lowerInput ||
            lowerInput.includes(c.kode.toLowerCase())
        );
      }

      if (!matchedCabang) {
        errors.push(`Cabang lomba "${cabangInput}" tidak ditemukan dalam master cabang aktif.`);
      } else {
        // Gender match check
        if (matchedCabang.gender === 'PUTRA' && jenisKelamin !== 'L') {
          errors.push(`Cabang "${matchedCabang.nama}" khusus untuk peserta Putra.`);
        }
        if (matchedCabang.gender === 'PUTRI' && jenisKelamin !== 'P') {
          errors.push(`Cabang "${matchedCabang.nama}" khusus untuk peserta Putri.`);
        }

        // Quota check for this institution
        const currentCount = existingPeserta.filter(
          p => p.lembagaId === lembagaId && p.cabangId === matchedCabang?.id
        ).length;
        if (currentCount >= matchedCabang.kuotaMaks) {
          errors.push(`Kuota cabang "${matchedCabang.nama}" untuk lembaga Anda sudah penuh (Maks: ${matchedCabang.kuotaMaks}).`);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
        if (isDuplicate) duplicateCount++;
      }

      rows.push({
        rowNumber: rowNum,
        nis,
        nisn,
        nik,
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        kelas,
        tingkat,
        cabangNamaOrKode: cabangInput,
        kategori,
        pembimbingNama,
        pembimbingHp,
        isValid,
        errors,
        matchedCabangId: matchedCabang?.id,
      });
    }

    return {
      rows,
      totalRows: rows.length,
      validCount,
      invalidCount,
      duplicateCount,
    };
  }

  // Save valid imported rows into database
  public static commitValidRows(
    validRows: ExcelImportRow[],
    lembagaId: string
  ): { savedCount: number; errors: string[] } {
    let saved = 0;
    const errors: string[] = [];
    const settings = StorageService.getPengaturan();

    for (const row of validRows) {
      if (!row.isValid || !row.matchedCabangId) continue;

      try {
        const id = StorageService.generatePesertaId();
        const nomorPeserta = StorageService.generateNomorPeserta();
        const cabang = StorageService.getCabangById(row.matchedCabangId);

        const newPeserta: Peserta = {
          id,
          nomorPeserta,
          lembagaId,
          nis: row.nis,
          nisn: row.nisn,
          nik: row.nik,
          nama: row.nama,
          tempatLahir: row.tempatLahir,
          tanggalLahir: row.tanggalLahir,
          jenisKelamin: row.jenisKelamin,
          kelas: row.kelas || getOpsiKelasByJenjang(row.tingkat)[0] || 'Kelas X',
          tingkat: (row.tingkat as any) || 'MA/SMA/SMK',
          cabangId: row.matchedCabangId,
          kategoriLomba: row.kategori,
          pembimbingNama: row.pembimbingNama,
          pembimbingHp: row.pembimbingHp,
          status: 'MENUNGGU VERIFIKASI',
          dokumenList: (cabang?.dokumenWajib || ['Foto Resmi 3x4', 'Kartu Pelajar']).map((doc, idx) => ({
            id: `DOC-${id.replace('PS-', '')}-${idx + 1}`,
            jenisDokumen: doc,
            namaFile: '',
            fileUrl: '',
            status: 'MENUNGGU',
            uploadedAt: new Date().toISOString(),
          })),
          isLocked: false,
          periodeId: settings.aktifPeriodeId || 'PRD-2026',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        StorageService.savePeserta(newPeserta);
        saved++;
      } catch (err: any) {
        errors.push(`Baris ${row.rowNumber} (${row.nama}): ${err.message}`);
      }
    }

    return { savedCount: saved, errors };
  }

  // Export filtered peserta list to Excel (.xlsx)
  public static exportPesertaToExcel(
    pesertaList: Peserta[],
    title: string = 'Rekapitulasi_Peserta_PORSENI'
  ): void {
    const lembagaMap = new Map(StorageService.getLembaga().map(l => [l.id, l.nama]));
    const cabangMap = new Map(StorageService.getCabang().map(c => [c.id, c.nama]));

    const exportRows = pesertaList.map((p, index) => ({
      'No': index + 1,
      'No. Peserta': p.nomorPeserta,
      'Nama Peserta': p.nama,
      'NISN': p.nisn,
      'NIK': p.nik,
      'NIS': p.nis,
      'Jenis Kelamin': p.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
      'Tempat, Tgl Lahir': `${p.tempatLahir}, ${p.tanggalLahir}`,
      'Kelas / Jenjang': `${p.kelas} (${p.tingkat})`,
      'Lembaga Asal': lembagaMap.get(p.lembagaId) || p.lembagaId,
      'Cabang Lomba': cabangMap.get(p.cabangId) || p.cabangId,
      'Kategori': p.kategoriLomba,
      'Status Verifikasi': p.status,
      'Pembimbing': p.pembimbingNama || '-',
      'Kontak Pembimbing': p.pembimbingHp || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta');

    const cleanFileName = `${title}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
  }

  // Export Lembaga list to Excel
  public static exportLembagaToExcel(): void {
    const list = StorageService.getLembaga();
    const peserta = StorageService.getPeserta();

    const rows = list.map((l, index) => {
      const pesertaLembaga = peserta.filter(p => p.lembagaId === l.id);
      return {
        'No': index + 1,
        'Kode Lembaga': l.id,
        'Nama Lembaga': l.nama,
        'NPSN': l.npsn,
        'NSM': l.nsm || '-',
        'Jenjang': l.jenjang,
        'Kabupaten/Kota': l.kabupatenKota,
        'Provinsi': l.provinsi,
        'Kepala / Pimpinan': l.pimpinanNama,
        'No. HP Pimpinan': l.pimpinanHp,
        'Operator': l.operatorNama,
        'No. HP Operator': l.operatorHp,
        'Email': l.operatorEmail,
        'Status': l.status,
        'Total Peserta': pesertaLembaga.length,
        'Peserta Terverifikasi': pesertaLembaga.filter(p => p.status === 'TERVERIFIKASI').length,
        'Tgl Registrasi': l.createdAt.slice(0, 10),
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Lembaga');
    XLSX.writeFile(wb, `Rekap_Lembaga_PORSENI_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
