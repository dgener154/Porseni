import React, { useState } from 'react';
import { StorageService, hashPassword } from '../../services/storage';
import { JenjangLembaga, Lembaga, User } from '../../types';
import { PorseniEmblem } from '../common/OfficialLogos';
import {
  ArrowLeft,
  Building2,
  UserCheck,
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RegistrasiLembagaProps {
  onBackToHome: () => void;
  onSuccess: (message: string) => void;
}

export const RegistrasiLembaga: React.FC<RegistrasiLembagaProps> = ({
  onBackToHome,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    // A. Identitas
    nama: '',
    npsn: '',
    nsm: '',
    jenjang: 'MA/SMA/SMK' as JenjangLembaga,
    statusLembaga: 'Negeri',
    alamat: '',
    desaKelurahan: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: 'Jawa Timur',
    kodePos: '',

    // B. Pimpinan
    pimpinanNama: '',
    pimpinanNip: '',
    pimpinanHp: '',
    pimpinanEmail: '',

    // C. Operator
    operatorNama: '',
    operatorNik: '',
    operatorHp: '',
    operatorEmail: '',
    username: '',
    password: '',
    confirmPassword: '',

    // D. Dokumen
    suratMandatNama: '',
    identitasLembagaNama: '',
    dokumenPendukungNama: '',

    // E. Pernyataan
    pernyataanSetuju: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (field: 'suratMandatNama' | 'identitasLembagaNama' | 'dokumenPendukungNama', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, [field]: file.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.pernyataanSetuju) {
      setErrorMsg('Anda wajib menyetujui pernyataan kebenaran data.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Kata sandi operator minimal 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      // Check if username, NPSN or email already exists
      const existingLembaga = StorageService.getLembaga();
      if (existingLembaga.some(l => l.npsn.trim() === formData.npsn.trim())) {
        setErrorMsg(`Lembaga dengan NPSN ${formData.npsn} sudah terdaftar dalam sistem.`);
        setLoading(false);
        return;
      }

      const existingUsers = StorageService.getUsers();
      if (existingUsers.some(u => u.username.toLowerCase() === formData.username.trim().toLowerCase())) {
        setErrorMsg(`Username "${formData.username}" sudah digunakan. Silakan gunakan username lain.`);
        setLoading(false);
        return;
      }

      const pHash = await hashPassword(formData.password);
      const newLembagaId = StorageService.generateLembagaId();
      const settings = StorageService.getPengaturan();

      const newLembaga: Lembaga = {
        id: newLembagaId,
        kodeLembaga: formData.nama.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase(),
        nama: formData.nama.trim(),
        npsn: formData.npsn.trim(),
        nsm: formData.nsm.trim() || undefined,
        jenjang: formData.jenjang,
        status: 'MENUNGGU VERIFIKASI',
        alamat: formData.alamat,
        desaKelurahan: formData.desaKelurahan,
        kecamatan: formData.kecamatan,
        kabupatenKota: formData.kabupatenKota,
        provinsi: formData.provinsi,
        kodePos: formData.kodePos,
        pimpinanNama: formData.pimpinanNama,
        pimpinanNip: formData.pimpinanNip,
        pimpinanHp: formData.pimpinanHp,
        pimpinanEmail: formData.pimpinanEmail,
        operatorNama: formData.operatorNama,
        operatorNik: formData.operatorNik,
        operatorHp: formData.operatorHp,
        operatorEmail: formData.operatorEmail,
        username: formData.username.trim().toLowerCase(),
        passwordHash: pHash,
        suratMandatNama: formData.suratMandatNama || 'Surat_Mandat_Lembaga.pdf',
        identitasLembagaNama: formData.identitasLembagaNama || 'Izin_Operasional.pdf',
        dokumenPendukungNama: formData.dokumenPendukungNama,
        catatanVerifikasi: 'Pendaftaran mandiri baru. Menunggu pemeriksaan berkas oleh administrator panitia.',
        periodeId: settings.aktifPeriodeId || 'PRD-2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save lembaga
      StorageService.saveLembaga(newLembaga);

      // Create linked user account
      const newUser: User = {
        id: `USR-${newLembagaId.replace('LG-', '')}`,
        username: formData.username.trim().toLowerCase(),
        email: formData.operatorEmail.trim().toLowerCase(),
        passwordHash: pHash,
        role: 'LEMBAGA',
        lembagaId: newLembagaId,
        namaLengkap: `${formData.operatorNama} (${formData.nama})`,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveUser(newUser);

      // Audit Log
      StorageService.addAuditLog({
        user: formData.username,
        role: 'LEMBAGA',
        aktivitas: 'Registrasi Lembaga Baru',
        rincian: `Lembaga ${formData.nama} (${newLembagaId}) berhasil mendaftar. Status: MENUNGGU VERIFIKASI`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });

      onSuccess(
        `Registrasi Lembaga ${formData.nama} berhasil! ID Anda: ${newLembagaId}. Status akun saat ini: MENUNGGU VERIFIKASI oleh Panitia.`
      );
      onBackToHome();
    } catch (err: any) {
      setErrorMsg('Gagal memproses pendaftaran: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-emerald-900 text-white px-6 py-6 border-b-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PorseniEmblem size={52} />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  FORMULIR RESMI PENDAFTARAN KONTINGEN
                </span>
                <h1 className="text-lg font-extrabold text-white">
                  Pendaftaran Lembaga / Satuan Pendidikan
                </h1>
                <p className="text-xs text-emerald-200">
                  Pekan Olahraga dan Seni (PORSENI) Nasional 2026
                </p>
              </div>
            </div>
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:text-white bg-emerald-800/80 rounded-lg border border-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold block">Pendaftaran Belum Dapat Diproses</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Section A: Identitas Lembaga */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                A. Identitas Lembaga / Sekolah / Madrasah
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Resmi Lembaga / Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: MAN 2 Kota Malang atau SMA Negeri 1..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Pokok Sekolah Nasional (NPSN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.npsn}
                  onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                  placeholder="8 digit angka..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Statistik Madrasah (NSM) (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.nsm}
                  onChange={e => setFormData({ ...formData, nsm: e.target.value })}
                  placeholder="12 digit angka (khusus madrasah)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenjang Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.jenjang}
                  onChange={e => setFormData({ ...formData, jenjang: e.target.value as JenjangLembaga })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="MI/SD">MI / SD (Sederajat)</option>
                  <option value="MTs/SMP">MTs / SMP (Sederajat)</option>
                  <option value="MA/SMA/SMK">MA / SMA / SMK (Sederajat)</option>
                  <option value="PERGURUAN TINGGI">Perguruan Tinggi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Lembaga <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.statusLembaga}
                  onChange={e => setFormData({ ...formData, statusLembaga: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Lembaga <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.alamat}
                  onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Nama jalan, nomor gedung, RT/RW..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.desaKelurahan}
                  onChange={e => setFormData({ ...formData, desaKelurahan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kecamatan}
                  onChange={e => setFormData({ ...formData, kecamatan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kabupaten / Kota <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kabupatenKota}
                  onChange={e => setFormData({ ...formData, kabupatenKota: e.target.value })}
                  placeholder="Contoh: Kota Malang"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Provinsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.provinsi}
                  onChange={e => setFormData({ ...formData, provinsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section B: Data Pimpinan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                B. Data Kepala Lembaga / Pimpinan Kontingen
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pimpinan & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pimpinanNama}
                  onChange={e => setFormData({ ...formData, pimpinanNama: e.target.value })}
                  placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Pd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / NIK Pimpinan
                </label>
                <input
                  type="text"
                  value={formData.pimpinanNip}
                  onChange={e => setFormData({ ...formData, pimpinanNip: e.target.value })}
                  placeholder="NIP jika ASN atau NIK..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp Pimpinan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.pimpinanHp}
                  onChange={e => setFormData({ ...formData, pimpinanHp: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Resmi Pimpinan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.pimpinanEmail}
                  onChange={e => setFormData({ ...formData, pimpinanEmail: e.target.value })}
                  placeholder="kepala@sekolah.sch.id"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section C: Data Operator */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Shield className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                C. Data Operator & Akun Login Lembaga
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.operatorNama}
                  onChange={e => setFormData({ ...formData, operatorNama: e.target.value })}
                  placeholder="Nama petugas operator..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIK Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.operatorNik}
                  onChange={e => setFormData({ ...formData, operatorNik: e.target.value })}
                  placeholder="16 digit NIK..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WA Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.operatorHp}
                  onChange={e => setFormData({ ...formData, operatorHp: e.target.value })}
                  placeholder="081333444555"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.operatorEmail}
                  onChange={e => setFormData({ ...formData, operatorEmail: e.target.value })}
                  placeholder="operator@lembaga.sch.id"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: operator.sman1"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 karakter"
                    className="w-full pr-8 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ketik ulang kata sandi di atas"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section D: Berkas Lembaga */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                D. Unggah Berkas & Dokumen Lembaga
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
                <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">Surat Rekomendasi / Mandat</span>
                <span className="text-[10px] text-slate-500 block mb-2">Format PDF / JPG (Maks. 2MB)</span>
                <label className="cursor-pointer inline-block px-3 py-1 bg-white border border-slate-300 hover:border-emerald-600 rounded text-[11px] font-semibold text-slate-700">
                  <span>{formData.suratMandatNama || 'Pilih File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => handleFileChange('suratMandatNama', e)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
                <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">Identitas Lembaga / Izin Operasional</span>
                <span className="text-[10px] text-slate-500 block mb-2">Format PDF / JPG (Maks. 2MB)</span>
                <label className="cursor-pointer inline-block px-3 py-1 bg-white border border-slate-300 hover:border-emerald-600 rounded text-[11px] font-semibold text-slate-700">
                  <span>{formData.identitasLembagaNama || 'Pilih File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => handleFileChange('identitasLembagaNama', e)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
                <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">Dokumen Pendukung Lainnya</span>
                <span className="text-[10px] text-slate-500 block mb-2">Opsional (Maks. 2MB)</span>
                <label className="cursor-pointer inline-block px-3 py-1 bg-white border border-slate-300 hover:border-emerald-600 rounded text-[11px] font-semibold text-slate-700">
                  <span>{formData.dokumenPendukungNama || 'Pilih File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => handleFileChange('dokumenPendukungNama', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section E: Pernyataan & Tombol Simpan */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.pernyataanSetuju}
                onChange={e => setFormData({ ...formData, pernyataanSetuju: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-emerald-950 leading-relaxed">
                "Saya menyatakan bahwa seluruh data lembaga dan operator yang diinput adalah benar, sah, dan dapat dipertanggungjawabkan sesuai peraturan perundang-undangan yang berlaku dalam rangka keikutsertaan PORSENI Nasional 2026."
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Mendaftarkan...' : 'Kirim Pendaftaran Lembaga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
