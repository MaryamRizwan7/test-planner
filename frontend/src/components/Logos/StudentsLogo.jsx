import React from "react";

const StudentsLogo = ({ size = 48, color = "white" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={color}
      viewBox="0 0 24 24"
    >
      <path d="M16 11c1.66 0 2.99-1.34 
      2.99-3S17.66 5 16 5s-3 1.34-3 
      3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 
      3-3S9.66 5 8 5 5 6.34 5 8s1.34 
      3 3 3zm0 2c-2.33 0-7 1.17-7 
      3.5V19h14v-2.5C15 14.17 10.33 
      13 8 13zm8 0c-.29 0-.62.02-.97.05 
      1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 
      14.17 18.33 13 16 13z" />
    </svg>
  );
};

export default StudentsLogo;
