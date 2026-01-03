import React from 'react';

interface StickyNoteProps {
  text: string;
  color: string;
  rotation: string;
  title?: string;
  date?: string;
  sticker?: string;
  fontSize?: string;
  className?: string;
  onClick?: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ text, color, rotation, title, date, sticker, fontSize, className, onClick }) => {
  const textSizeClass = fontSize || "text-lg sm:text-2xl";

  // Helper to extract numeric rotation from Tailwind class or use raw value
  const getRotationStyle = (rot: string) => {
    if (!rot) return { transform: 'rotate(0deg)' };
    
    // Check for arbitrary value format: rotate-[5deg]
    const match = rot.match(/rotate-\[?(-?\d+)(deg)?\]?/);
    if (match) {
      return { transform: `rotate(${match[1]}deg)` };
    }
    
    // Check for standard Tailwind classes: rotate-1, -rotate-2, etc.
    const standardMatch = rot.match(/(-?)rotate-(\d+)/);
    if (standardMatch) {
      const sign = standardMatch[1] === '-' ? -1 : 1;
      const val = parseInt(standardMatch[2]);
      // Approximate mappings for standard Tailwind rotate classes
      // 1=1deg, 2=2deg, 3=3deg, 6=6deg, 12=12deg
      return { transform: `rotate(${sign * val}deg)` };
    }

    return { transform: 'rotate(0deg)' };
  };

  return (
    <div 
      onClick={onClick}
      style={getRotationStyle(rotation)}
      className={`relative p-4 sm:p-6 shadow-xl transition-all hover:scale-105 hover:z-20 flex flex-col justify-between items-center text-center w-40 min-h-[160px] sm:w-56 sm:min-h-[220px] ${color} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Tape effect */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-8 bg-white/40 rotate-2 backdrop-blur-sm shadow-sm pointer-events-none"></div>
      
      {/* Sticker - Absolute positioned like a stamp */}
      {sticker && (
        <div className="absolute -top-2 -right-2 text-4xl sm:text-5xl transform rotate-12 drop-shadow-md transition-transform pointer-events-none opacity-90">
          {sticker}
        </div>
      )}

      {/* Edit Hint (only visible on hover if onClick is present) */}
      {onClick && (
        <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 rounded-sm flex items-center justify-center transition-opacity pointer-events-none">
          <span className="bg-white/80 px-2 py-1 rounded text-[10px] sm:text-xs font-bold text-gray-600 shadow-sm backdrop-blur-sm">Click to Edit</span>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center w-full mt-3 sm:mt-4">
        {title && (
          <h3 className="font-bold text-xs sm:text-sm mb-1 sm:mb-2 text-gray-800 uppercase tracking-widest border-b border-black/10 pb-1 mx-auto">
            {title}
          </h3>
        )}
        <p className={`font-handwriting ${textSizeClass} leading-snug text-gray-900 break-words whitespace-pre-wrap`}>
          {text}
        </p>
      </div>

      {date && (
        <div className="mt-3 sm:mt-4 self-end transform -rotate-1 w-full text-right">
           <span className="font-handwriting text-[10px] sm:text-xs font-bold text-gray-500 bg-white/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm shadow-sm">
             {date}
           </span>
        </div>
      )}
    </div>
  );
};

export default StickyNote;