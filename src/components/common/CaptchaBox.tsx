import React, { useState } from 'react';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react';

interface CaptchaBoxProps {
  onVerified: (isVerified: boolean) => void;
  isVerified: boolean;
}

export const CaptchaBox: React.FC<CaptchaBoxProps> = ({ onVerified, isVerified }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleBoxClick = () => {
    if (isVerified) return;
    // Instant, immediate verification response
    setIsVerifying(true);
    onVerified(true);
    setIsVerifying(false);
  };

  return (
    <div
      onClick={handleBoxClick}
      className={`flex items-center justify-between p-3.5 bg-slate-50 border rounded-lg transition-all shadow-xs cursor-pointer select-none ${
        isVerified
          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
          : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-100/70'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            handleBoxClick();
          }}
          disabled={isVerified || isVerifying}
          className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
            isVerified
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-400 bg-white hover:border-slate-600'
          }`}
        >
          {isVerifying ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : isVerified ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : null}
        </button>
        <span className="text-xs font-semibold text-slate-700">
          {isVerifying
            ? 'Memverifikasi...'
            : isVerified
            ? 'Verifikasi Berhasil: Saya bukan robot'
            : 'Saya bukan robot'}
        </span>
      </div>

      <div className="flex flex-col items-center pl-3 text-right border-l border-slate-200">
        <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-700' : 'text-slate-400'}`} />
        <span className="text-[10px] font-bold text-slate-500 leading-tight">reCAPTCHA</span>
        <span className="text-[8px] text-slate-400">Keamanan PORSENI</span>
      </div>
    </div>
  );
};
