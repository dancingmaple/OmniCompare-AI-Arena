import React from 'react';

interface ExtensionIconProps {
  className?: string;
  size?: number;
}

export const ExtensionIcon: React.FC<ExtensionIconProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="navBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id="navNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="navCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#navBgGrad)" />
      <rect
        x="3"
        y="3"
        width="122"
        height="122"
        rx="25"
        fill="none"
        stroke="url(#navNeonGrad)"
        strokeWidth="3"
        strokeOpacity="0.8"
      />
      {/* Central comparative core */}
      <circle cx="64" cy="64" r="18" fill="url(#navCoreGrad)" filter="url(#navGlow)" />
      <circle cx="64" cy="64" r="8" fill="#FFFFFF" />
      {/* 4 Multi-model peripheral nodes */}
      <circle cx="34" cy="40" r="10" fill="#10B981" filter="url(#navGlow)" />
      <circle cx="94" cy="40" r="10" fill="#3B82F6" filter="url(#navGlow)" />
      <circle cx="34" cy="88" r="10" fill="#8B5CF6" filter="url(#navGlow)" />
      <circle cx="94" cy="88" r="10" fill="#F59E0B" filter="url(#navGlow)" />
      {/* Beams */}
      <line x1="41" y1="46" x2="52" y2="55" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      <line x1="87" y1="46" x2="76" y2="55" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      <line x1="41" y1="82" x2="52" y2="73" stroke="#818CF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      <line x1="87" y1="82" x2="76" y2="73" stroke="#EC4899" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      {/* Sparkle */}
      <polygon points="64,18 66.5,27 75,29.5 66.5,32 64,41 61.5,32 53,29.5 61.5,27" fill="#FDE047" />
    </svg>
  );
};
