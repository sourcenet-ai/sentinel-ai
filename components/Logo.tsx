
import React from 'react';

interface Props {
  className?: string;
}

const Logo: React.FC<Props> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`${className} relative group`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        
        {/* Outer Shield Glow */}
        <path 
          d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 L50 5Z" 
          fill="rgba(34,211,238,0.1)" 
        />
        
        {/* Main Shield Body */}
        <path 
          d="M50 8 L85 22 V48 C85 70 50 88 50 88 C50 88 15 70 15 48 V22 L50 8Z" 
          fill="url(#shieldGrad)" 
          stroke="url(#cyanGrad)" 
          strokeWidth="2" 
        />
        
        {/* Orange Accent wing */}
        <path 
          d="M60 12 L92 24 L85 48 L65 30 Z" 
          fill="#FB923C" 
          opacity="0.9"
        />

        {/* Radiating Threat Lines */}
        <g stroke="#22D3EE" strokeWidth="0.8" opacity="0.6">
          <line x1="50" y1="50" x2="35" y2="35" />
          <line x1="50" y1="50" x2="65" y2="35" />
          <line x1="50" y1="50" x2="35" y2="65" />
          <line x1="50" y1="50" x2="65" y2="65" />
          <line x1="50" y1="50" x2="50" y2="30" />
          <line x1="50" y1="50" x2="50" y2="70" />
          <line x1="50" y1="50" x2="30" y2="50" />
          <line x1="50" y1="50" x2="70" y2="50" />
        </g>
        
        {/* Nodes on lines */}
        <g fill="#22D3EE">
          <circle cx="35" cy="35" r="1.5" />
          <circle cx="65" cy="35" r="1.5" />
          <circle cx="35" cy="65" r="1.5" />
          <circle cx="65" cy="65" r="1.5" />
          <circle cx="50" cy="30" r="1.5" />
          <circle cx="50" cy="70" r="1.5" />
          <circle cx="30" cy="50" r="1.5" />
          <circle cx="70" cy="50" r="1.5" />
        </g>

        {/* Central Eye / Target */}
        <circle cx="50" cy="50" r="14" stroke="#22D3EE" strokeWidth="1" />
        <circle cx="50" cy="50" r="10" stroke="#22D3EE" strokeWidth="0.5" strokeDasharray="2 2" />
        
        {/* Pupil/Core */}
        <circle cx="50" cy="50" r="4" fill="#EF4444" className="animate-pulse" />
        
        {/* Crosshair segments */}
        <path d="M50 32 V40 M50 60 V68 M32 50 H40 M60 50 H68" stroke="#22D3EE" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default Logo;
