
import React from 'react';

export default function Logo({ className }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 L50 5Z" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
        <circle cx="50" cy="50" r="10" stroke="#f97316" strokeWidth="1" />
        <circle cx="50" cy="50" r="4" fill="#ef4444" />
      </svg>
    </div>
  );
}
