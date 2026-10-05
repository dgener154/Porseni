/**
 * Helper pemetaan opsi tingkat & kelas peserta lomba berdasarkan jenjang lembaga:
 * - SMA/MA/SMK: Kelas X, Kelas XI, Kelas XII
 * - SMP/MTs: Kelas VII, Kelas VIII, Kelas IX
 * - SD/MI: Kelas I, Kelas II, Kelas III, Kelas IV, Kelas V, Kelas VI
 * - Perguruan Tinggi: Semester 1 s/d Semester 8
 */

export function getOpsiKelasByJenjang(jenjang?: string): string[] {
  if (!jenjang) return ['Kelas X', 'Kelas XI', 'Kelas XII'];
  const j = jenjang.toUpperCase().trim();

  // SMA / MA / SMK
  if (j.includes('SMA') || j.includes('MA') || j.includes('SMK') || j.includes('SLTA')) {
    return ['Kelas X', 'Kelas XI', 'Kelas XII'];
  }

  // SMP / MTs
  if (j.includes('SMP') || j.includes('MTS') || j.includes('SLTP')) {
    return ['Kelas VII', 'Kelas VIII', 'Kelas IX'];
  }

  // SD / MI
  if (j.includes('SD') || j.includes('MI')) {
    return ['Kelas I', 'Kelas II', 'Kelas III', 'Kelas IV', 'Kelas V', 'Kelas VI'];
  }

  // Perguruan Tinggi
  if (
    j.includes('PERGURUAN') ||
    j.includes('TINGGI') ||
    j.includes('KAMPUS') ||
    j.includes('UNIVERSITAS') ||
    j.includes('MAHASISWA')
  ) {
    return [
      'Semester 1',
      'Semester 2',
      'Semester 3',
      'Semester 4',
      'Semester 5',
      'Semester 6',
      'Semester 7',
      'Semester 8',
    ];
  }

  // Default fallback
  return ['Kelas X', 'Kelas XI', 'Kelas XII'];
}

export function getLabelJenjang(jenjang?: string): string {
  if (!jenjang) return 'SMA / MA / SMK';
  const j = jenjang.toUpperCase().trim();
  if (j.includes('SMA') || j.includes('MA') || j.includes('SMK')) return 'SMA / MA / SMK';
  if (j.includes('SMP') || j.includes('MTS')) return 'SMP / MTs';
  if (j.includes('SD') || j.includes('MI')) return 'SD / MI';
  if (j.includes('PERGURUAN') || j.includes('TINGGI')) return 'Perguruan Tinggi';
  return jenjang;
}
