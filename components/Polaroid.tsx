import React from 'react';

interface PolaroidProps {
  src: string;
  caption: string;
  rotation: string;
  sticker?: string;
  imageFit?: 'cover' | 'contain';
  onClick?: () => void;
}

const Polaroid: React.FC<PolaroidProps> = ({ src, caption, rotation, sticker, imageFit = 'cover', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-3 pb-8 shadow-lg transition-all hover:scale-110 hover:z-20 ${onClick ? 'cursor-pointer' : ''} relative group`}
    >
      <div className={`overflow-hidden aspect-square mb-3 bg-gray-100 flex items-center justify-center`}>
        <img 
          src={src} 
          alt={caption} 
          className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
          loading="lazy" 
        />
      </div>
      <p className="text-center font-handwriting text-gray-600 text-lg">{caption}</p>

      {/* Sticker - Absolute positioned like a stamp, same size as StickyNote */}
      {sticker && (
        <div className="absolute -top-3 -right-3 text-5xl transform rotate-12 drop-shadow-md transition-transform pointer-events-none opacity-90 z-30">
          {sticker}
        </div>
      )}

      {/* Edit Hint */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <span className="bg-white/90 p-1.5 rounded-full shadow-md text-gray-600 text-xs">
            <i className="fas fa-pencil-alt"></i>
          </span>
        </div>
      )}
    </div>
  );
};

export default Polaroid;