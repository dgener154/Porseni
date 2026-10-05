import React from 'react';

export const PorseniEmblem: React.FC<{
  className?: string;
  size?: number;
  logoUrl?: string;
  alt?: string;
}> = ({
  className = '',
  size = 48,
  logoUrl: propLogoUrl,
  alt = 'Logo Porseni',
}) => {
  const [currentLogo, setCurrentLogo] = React.useState<string | undefined>(() => {
    if (propLogoUrl) return propLogoUrl;
    try {
      const data = localStorage.getItem('porseni_pengaturan_v1');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.logoUrl || undefined;
      }
    } catch {
      // ignore
    }
    return undefined;
  });

  React.useEffect(() => {
    if (propLogoUrl !== undefined) {
      setCurrentLogo(propLogoUrl);
      return;
    }

    const checkStorage = (e?: Event) => {
      try {
        const customEvent = e as CustomEvent;
        if (customEvent && customEvent.detail && customEvent.detail.logoUrl !== undefined) {
          setCurrentLogo(customEvent.detail.logoUrl || undefined);
          return;
        }
        const data = localStorage.getItem('porseni_pengaturan_v1');
        if (data) {
          const parsed = JSON.parse(data);
          setCurrentLogo(parsed.logoUrl || undefined);
        } else {
          setCurrentLogo(undefined);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('porseni_pengaturan_updated', checkStorage);
    window.addEventListener('storage', checkStorage);
    return () => {
      window.removeEventListener('porseni_pengaturan_updated', checkStorage);
      window.removeEventListener('storage', checkStorage);
    };
  }, [propLogoUrl]);

  if (currentLogo) {
    return (
      <img
        src={currentLogo}
        alt={alt}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`object-contain inline-block shrink-0 ${className}`}
        onError={() => setCurrentLogo(undefined)}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="porseni_grad_emerald" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#047857" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="porseni_grad_gold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      
      {/* Outer Golden Laurel Ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#porseni_grad_gold)" strokeWidth="3" />
      <circle cx="50" cy="50" r="41" fill="url(#porseni_grad_emerald)" />
      
      {/* 5-pointed Islamic / Indonesian star on top */}
      <polygon points="50,15 53,23 61,23 54,28 57,36 50,31 43,36 46,28 39,23 47,23" fill="#fef08a" />

      {/* Stylized Olympic/Sports Torch & Artistic Quill Feather */}
      {/* Torch Body */}
      <path
        d="M48 68 L52 68 L54 48 L46 48 Z"
        fill="url(#porseni_grad_gold)"
      />
      {/* Torch Base */}
      <path d="M45 68 L55 68 L53 74 L47 74 Z" fill="#b45309" />
      
      {/* Artistic Flame / Musical Feather wings */}
      <path
        d="M50 36 C56 42 62 44 57 51 C52 57 48 57 44 51 C39 44 45 42 50 36 Z"
        fill="#f59e0b"
      />
      <path
        d="M50 39 C53 43 57 44 54 49 C51 53 49 53 46 49 C43 44 47 43 50 39 Z"
        fill="#fef08a"
      />

      {/* Decorative Laurel Sprigs Left & Right */}
      <path
        d="M24 54 C24 66 35 78 50 82 C65 78 76 66 76 54"
        stroke="#fde047"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ribbon Banner at bottom */}
      <path
        d="M30 80 Q50 86 70 80 L68 87 Q50 92 32 87 Z"
        fill="url(#porseni_grad_gold)"
      />
      <text
        x="50"
        y="86"
        textAnchor="middle"
        fontSize="5"
        fontWeight="800"
        fill="#064e3b"
        letterSpacing="0.8"
      >
        PORSENI
      </text>
    </svg>
  );
};

export const GarudaWatermark: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      <path
        d="M50 10 C52 14 55 18 60 20 C68 23 78 22 84 27 C75 32 68 39 65 48 C72 50 82 51 86 58 C78 61 70 63 64 68 C68 76 72 84 70 90 C62 86 56 80 50 78 C44 80 38 86 30 90 C28 84 32 76 36 68 C30 63 22 61 14 58 C18 51 28 50 35 48 C32 39 25 32 16 27 C22 22 32 23 40 20 C45 18 48 14 50 10 Z"
        opacity="0.08"
      />
    </svg>
  );
};
