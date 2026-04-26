// src/components/Logo.jsx
import React from "react";

const Logo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="40"
      viewBox="0 0 24 24"
      fill="white" // ✅ White color for dark background
    >
      {/* Calendar Outline */}
      <rect x="3" y="4" width="18" height="17" rx="2" ry="2" stroke="white" strokeWidth="2" fill="none" />
      
      {/* Top Header Line */}
      <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2" />
      
      {/* Calendar Date Squares */}
      <rect x="6" y="12" width="3" height="3" fill="white" />
      <rect x="10.5" y="12" width="3" height="3" fill="white" />
      <rect x="15" y="12" width="3" height="3" fill="white" />
      <rect x="6" y="16" width="3" height="3" fill="white" />
      <rect x="10.5" y="16" width="3" height="3" fill="white" />
      <rect x="15" y="16" width="3" height="3" fill="white" />
      
      {/* Calendar Rings */}
      <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default Logo;
