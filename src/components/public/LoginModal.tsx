import React, { useState } from 'react';
import { AuthService, UserSession } from '../../services/auth';
import { UserRole } from '../../types';
import { CaptchaBox } from '../common/CaptchaBox';
import { PorseniEmblem } from '../common/OfficialLogos';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  School,
  UserCog,
} from 'lucide-react';

interface LoginModalProps {
  initialRole?: UserRole;
  onSuccess: (session: UserSession) => void;
  onForgotPassword: () => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  initialRole = 'ADMIN',
  onSuccess,
  onForgotPassword,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Username atau Email wajib diisi.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    setIsCaptchaVerified(true);
    setLoading(true);

    try {
      const result = await AuthService.login(
        identifier,
        password,
        selectedRole,
        rememberMe
      );

      if (result.success && result.session) {
        onSuccess(result.session);
      } else {
        setErrorMsg(result.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan teknis saat menghubungi server autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 text-center border-b-4 border-amber-400 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-emerald-200 hover:text-white text-xs px-2.5 py-1 rounded bg-emerald-800/80 hover:bg-emerald-800 cursor-pointer"
            >
              ✕ Tutup
            </button>
          )}

          <PorseniEmblem size={56} className="mx-auto mb-2" />
          <h2 className="text-base font-extrabold tracking-wider uppercase text-amber-300">
            PORTAL MASUK PORSENI DIGITAL
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            Sistem Informasi Resmi Pekan Olahraga dan Seni
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>ADMIN / PANITIA</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('LEMBAGA')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'LEMBAGA'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-4 h-4" />
            <span>LEMBAGA TERDAFTAR</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Portal Info Notice (No credentials revealed) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] leading-relaxed">
              {selectedRole === 'ADMIN'
                ? 'Silakan masukkan kredensial administrator panitia untuk mengakses panel kendali.'
                : 'Silakan masukkan email / username dan kata sandi lembaga yang telah terverifikasi.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {selectedRole === 'ADMIN' ? 'Email / Username Administrator' : 'Email / Username Operator Lembaga'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'Masukkan username atau email admin...' : 'Masukkan username atau email lembaga...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Functional Fast CAPTCHA Box */}
          <div className="pt-1">
            <CaptchaBox
              isVerified={isCaptchaVerified}
              onVerified={setIsCaptchaVerified}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Memverifikasi...' : 'LOGIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Footnote By M4s Broe */}
          <div className="pt-2 text-center">
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider">
              By M4s Broe
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
