import React, { useState } from 'react';
import { Lembaga } from '../../types';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import {
  Building2,
  UserCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

interface LembagaProfilProps {
  lembaga: Lembaga;
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const LembagaProfil: React.FC<LembagaProfilProps> = ({
  lembaga,
  onRefresh,
  onShowToast,
}) => {
  const [formData, setFormData] = useState({
    nama: lembaga.nama,
    npsn: lembaga.npsn,
    nsm: lembaga.nsm || '',
    jenjang: lembaga.jenjang,
    alamat: lembaga.alamat,
    desaKelurahan: lembaga.desaKelurahan,
    kecamatan: lembaga.kecamatan,
    kabupatenKota: lembaga.kabupatenKota,
    provinsi: lembaga.provinsi,
    kodePos: lembaga.kodePos,
    pimpinanNama: lembaga.pimpinanNama,
    pimpinanNip: lembaga.pimpinanNip || '',
    pimpinanHp: lembaga.pimpinanHp,
    pimpinanEmail: lembaga.pimpinanEmail,
    operatorNama: lembaga.operatorNama,
    operatorNik: lembaga.operatorNik,
    operatorHp: lembaga.operatorHp,
    operatorEmail: lembaga.operatorEmail,
  });

  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const updated: Lembaga = {
        ...lembaga,
        ...formData,
      };
      StorageService.saveLembaga(updated);
      StorageService.addAuditLog({
        user: lembaga.operatorNama,
        role: 'LEMBAGA',
        aktivitas: 'Perbarui Profil Lembaga',
        rincian: `Memperbarui identitas dan kontak lembaga ${updated.nama}`,
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
      onShowToast('success', 'Profil lembaga berhasil disimpan!');
      onRefresh();
    } catch {
      onShowToast('error', 'Gagal menyimpan pembaruan profil.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    if (pwForm.newPassword.length < 6) {
      setPwError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setPwLoading(true);
    const session = AuthService.getSession();
    if (!session) {
      setPwError('Sesi login tidak valid.');
      setPwLoading(false);
      return;
    }

    const res = await AuthService.changePassword(
      session.user.id,
      pwForm.oldPassword,
      pwForm.newPassword
    );

    setPwLoading(false);
    if (res.success) {
      onShowToast('success', res.message);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPwError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Profile Edit Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-200">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Profil Kontingen & Satuan Pendidikan
            </h2>
            <p className="text-xs text-slate-500">
              ID Resmi: <strong className="font-mono text-emerald-800">{lembaga.id}</strong> · Status: {lembaga.status}
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-6">
          {/* Identitas Lembaga */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              A. Identitas Lembaga
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Resmi Lembaga</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NPSN</label>
                <input
                  type="text"
                  required
                  value={formData.npsn}
                  onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NSM (Khusus Madrasah)</label>
                <input
                  type="text"
                  value={formData.nsm}
                  onChange={e => setFormData({ ...formData, nsm: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.alamat}
                  onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  required
                  value={formData.kabupatenKota}
                  onChange={e => setFormData({ ...formData, kabupatenKota: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  required
                  value={formData.provinsi}
                  onChange={e => setFormData({ ...formData, provinsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Pimpinan & Operator */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              B. Data Kontak & Operator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pimpinan / Kepala</label>
                <input
                  type="text"
                  required
                  value={formData.pimpinanNama}
                  onChange={e => setFormData({ ...formData, pimpinanNama: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA Pimpinan</label>
                <input
                  type="text"
                  required
                  value={formData.pimpinanHp}
                  onChange={e => setFormData({ ...formData, pimpinanHp: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Operator</label>
                <input
                  type="text"
                  required
                  value={formData.operatorNama}
                  onChange={e => setFormData({ ...formData, operatorNama: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA Operator</label>
                <input
                  type="text"
                  required
                  value={formData.operatorHp}
                  onChange={e => setFormData({ ...formData, operatorHp: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saveLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Change Password Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200">
          <KeyRound className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Ubah Kata Sandi Akun
            </h3>
            <p className="text-xs text-slate-500">
              Kata sandi bawaan awal yang dibuat panitia adalah: <code className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">123456</code>. Anda disarankan segera menggantinya demi keamanan akun kontingen.
            </p>
          </div>
        </div>

        {pwError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Saat Ini <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.oldPassword}
              onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru (Min. 6 Karakter) <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={pwForm.confirmPassword}
              onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPw ? 'Sembunyikan' : 'Tampilkan'} Kata Sandi</span>
            </button>

            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {pwLoading ? 'Memproses...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
