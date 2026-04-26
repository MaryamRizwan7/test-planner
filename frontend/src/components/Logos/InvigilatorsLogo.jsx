import React from "react";

const InvigilatorsLogo = ({ size = 48, color = "white" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
    >
      {/* Head */}
      <circle cx="12" cy="9" r="3.5" />
      {/* Shoulders / upper body */}
      <path d="M5 18c0-3.5 7-3.5 7-3.5s7 0 7 3.5v2H5v-2z" />
    </svg>
  );
};

export default InvigilatorsLogo;
