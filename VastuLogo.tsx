import React from 'react';

interface VastuLogoProps {
  className?: string;
  size?: number;
  variant?: 'dark' | 'light';
}

export const VastuLogo: React.FC<VastuLogoProps> = ({
  className = '',
  size = 38,
  variant = 'dark',
}) => {
  const primaryStroke = variant === 'dark' ? '#172B36' : '#F4EFE6';
  const goldAccent = '#C49A60';
  const sageAccent = variant === 'dark' ? '#667C70' : '#94ABA0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Royal Octagonal Architectural Frame */}
      <polygon
        points="16,6 48,6 58,16 58,48 48,58 16,58 6,48 6,16"
        stroke={goldAccent}
        strokeWidth="1.75"
        fill={variant === 'dark' ? '#FAF7F2' : '#0F1E26'}
      />
      {/* Floor-plan inner grid lines */}
      <path
        d="M14 28H50M32 14V50"
        stroke={sageAccent}
        strokeWidth="1"
        strokeDasharray="2.5 2.5"
        opacity="0.55"
      />
      {/* Modern Indian pitched roof silhouette */}
      <path
        d="M14 27L32 13L50 27"
        stroke={primaryStroke}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Architectural eave extension */}
      <path
        d="M11 27H20M44 27H53"
        stroke={goldAccent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Monumental V geometry intersecting the floor-plan plinth */}
      <path
        d="M21 26L32 49L43 26"
        stroke={primaryStroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner gold V drafting core */}
      <path
        d="M26 26L32 39L38 26"
        stroke={goldAccent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cardinal base plinth */}
      <line
        x1="20"
        y1="52"
        x2="44"
        y2="52"
        stroke={goldAccent}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
