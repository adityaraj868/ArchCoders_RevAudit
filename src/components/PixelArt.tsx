import React from 'react';

export const PacmanIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a8 8 0 100 16 7.9 7.9 0 005.65-2.35l-5.65-5.65 5.65-5.65A7.9 7.9 0 008 0zm3 4a1 1 0 110 2 1 1 0 010-2z" />
  </svg>
);

export const GhostIcon: React.FC<{ color: string; className?: string; type?: 'blinky' | 'pinky' | 'inky' | 'clyde' }> = ({
  color,
  className = 'w-12 h-12',
  type = 'blinky'
}) => {
  // SVG representation of a retro pixel ghost
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ghost Body */}
      <path
        d="M1 15V7C1 3.13 4.13 0 8 0C11.87 0 15 3.13 15 7V15L13 13L11 15L9 13L7 15L5 13L3 15L1 15Z"
        fill={color}
      />
      {/* Eyes */}
      <rect x="3" y="5" width="2" height="3" fill="white" />
      <rect x="9" y="5" width="2" height="3" fill="white" />
      {/* Pupils (looking in different directions based on ghost) */}
      {type === 'blinky' && (
        <>
          <rect x="3" y="5" width="1" height="2" fill="blue" />
          <rect x="9" y="5" width="1" height="2" fill="blue" />
        </>
      )}
      {type === 'pinky' && (
        <>
          <rect x="3.5" y="4" width="1" height="2" fill="blue" />
          <rect x="9.5" y="4" width="1" height="2" fill="blue" />
        </>
      )}
      {type === 'inky' && (
        <>
          <rect x="4" y="5.5" width="1" height="2" fill="blue" />
          <rect x="10" y="5.5" width="1" height="2" fill="blue" />
        </>
      )}
      {type === 'clyde' && (
        <>
          <rect x="3" y="6" width="1" height="2" fill="blue" />
          <rect x="9" y="6" width="1" height="2" fill="blue" />
        </>
      )}
    </svg>
  );
};

export const PelletIcon: React.FC<{ className?: string; power?: boolean }> = ({
  className = 'w-3 h-3',
  power = false
}) => (
  <div
    className={`${className} rounded-none bg-[#fdfdcb] ${
      power ? 'animate-pulse ring-4 ring-[#ffeb3b]/50 shadow-[0_0_10px_#ffeb3b]' : ''
    }`}
  />
);

export const CherryIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="11" r="3" fill="#ff0000" />
    <circle cx="11" cy="9" r="3" fill="#ff0000" />
    <path d="M5 8c0-3 3-5 5-5" stroke="#00ff00" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11 6c0-1.5-.5-2.5-1-3" stroke="#00ff00" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="9" y="1" width="3" height="1" fill="#00ff00" />
  </svg>
);

export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);
