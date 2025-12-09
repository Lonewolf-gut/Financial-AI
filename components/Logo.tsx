import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#10b981" /> {/* Emerald-500 */}
        <stop offset="100%" stopColor="#0f172a" /> {/* Slate-900 */}
      </linearGradient>
    </defs>
    {/* Abstract Knot Shape */}
    <path 
      d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" 
      fill="none" 
      stroke="url(#logoGradient)" 
      strokeWidth="8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M50 25 L72 38 L72 62 L50 75 L28 62 L28 38 Z" 
      className="fill-emerald-500"
      fillOpacity="0.9"
    />
    <path 
      d="M50 35 L62 42 L62 58 L50 65 L38 58 L38 42 Z" 
      className="fill-slate-900"
    />
  </svg>
);