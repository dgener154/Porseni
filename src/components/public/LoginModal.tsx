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
  HelpCircle,
  ArrowRight,
  School,
  UserCog,
  Zap,
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
  const [identifier, setIdentifier] = useState(
    initialRole === 'ADMIN' ? 'admin@porseni.go.id' : 'operator@man1malang.sch.id'
  );
  const [password, setPassword] = useState(
    initialRole === 'ADMIN' ? 'admin123' : '123456'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'ADMIN') {
      setIdentifier('admin@porseni.go.id');
      setPassword('admin123');
    } else {
      setIdentifier('operator@man1malang.sch.id');
      setPassword('123456');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
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

  // Quick 1-click login for admin access
  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsCaptchaVerified(true);

    const result = await AuthService.login(
      'admin@porseni.go.id',
      'admin123',
      'ADMIN',
      true
    );

    setLoading(false);
    if (result.success && result.session) {
      onSuccess(result.session);
    } else {
      setErrorMsg(result.message);
    }
  };

  // Quick 1-click login for lembaga
  const handleQuickLembagaLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsCaptchaVerified(true);

    const result = await AuthService.login(
      'operator@man1malang.sch.id',
      '123456',
      'LEMBAGA',
      true
    );

    setLoading(false);
    if (result.success && result.session) {
      onSuccess(result.session);
    } else {
      setErrorMsg(result.message);
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
              className="absolute right-4 top-4 text-emerald-200 hover:text-white text-xs px-2.5 py-1 rounded bg-emerald-800/80 hover:bg-emerald-800"
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

        {/* Quick Demo Login Banner */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Akses Cepat Pengujian:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-md shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>Admin</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleQuickLembagaLogin}
              disabled={loading}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-md shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>Lembaga</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
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
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {selectedRole === 'ADMIN' ? 'Email / Username Administrator' : 'Username / Email Operator'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'admin@porseni.go.id' : 'operator.man1'}
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
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 absolute right-3 top-2.5"
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
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Memverifikasi...' : 'MASUK KE SISTEM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Help Info Toggle */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan Akun & Akses Demo</span>
            </button>

            {showHelp && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                <p className="font-bold text-slate-800">Akun Demo Siap Pakai:</p>
                <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[10px]">
                  <strong>Admin:</strong> admin@porseni.go.id / <em>admin123</em>
                </div>
                <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[10px]">
                  <strong>Lembaga 1:</strong> operator.man1 / <em>password123</em>
                </div>
                <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[10px]">
                  <strong>Lembaga 2:</strong> operator.sman3 / <em>password123</em>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
