import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  passcode: string;
  onUnlock: () => void;
  stickers: string[];
}

const LockScreen: React.FC<LockScreenProps> = ({ passcode, onUnlock, stickers }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  
  // Randomly position stickers for background
  const [bgStickers, setBgStickers] = useState<{char: string, left: string, top: string, rot: string}[]>([]);

  useEffect(() => {
    // Generate 20 random background stickers
    const newStickers = Array.from({ length: 20 }).map(() => ({
      char: stickers[Math.floor(Math.random() * stickers.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      rot: `${Math.random() * 360}deg`
    }));
    setBgStickers(newStickers);
  }, [stickers]);

  const handleNumClick = (num: number) => {
    if (input.length < 4) {
      const newInput = input + num.toString();
      setInput(newInput);
      setError(false);
      
      if (newInput.length === 4) {
        if (newInput === passcode) {
          setTimeout(onUnlock, 100);
        } else {
          setTimeout(() => {
            setError(true);
            setInput('');
          }, 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-pink-100 flex items-center justify-center overflow-hidden">
      {/* Background Stickers */}
      {bgStickers.map((s, i) => (
        <div 
          key={i}
          className="absolute text-4xl opacity-30 pointer-events-none animate-blob"
          style={{
            left: s.left,
            top: s.top,
            transform: `rotate(${s.rot})`,
            animationDelay: `${i * 0.2}s`
          }}
        >
          {s.char}
        </div>
      ))}

      {/* Lock Card */}
      <div className="relative bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-sm mx-4 animate-fadeIn">
         <div className="text-center mb-8">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
               <i className={`fas ${error ? 'fa-lock text-red-400' : 'fa-lock text-rose-400'} text-3xl transition-colors`}></i>
            </div>
            <h2 className="text-2xl font-handwriting text-gray-800 font-bold">Welcome Back! ✨</h2>
            <p className="text-xs text-gray-500 mt-1">Enter your passcode to manifest</p>
         </div>

         {/* Dots Display */}
         <div className="flex justify-center gap-4 mb-8">
           {[0, 1, 2, 3].map(i => (
             <div 
               key={i} 
               className={`w-4 h-4 rounded-full transition-all duration-200 ${
                 i < input.length 
                   ? error 
                     ? 'bg-red-400 scale-110' 
                     : 'bg-rose-500 scale-110' 
                   : 'bg-gray-300'
               }`}
             />
           ))}
         </div>
         
         {/* Keypad */}
         <div className="grid grid-cols-3 gap-4 px-4">
           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
             <button
               key={num}
               onClick={() => handleNumClick(num)}
               className="w-16 h-16 rounded-full bg-white/50 hover:bg-white shadow-sm font-bold text-xl text-gray-700 active:scale-95 transition-all mx-auto flex items-center justify-center"
             >
               {num}
             </button>
           ))}
           <div className="col-start-2">
             <button
               onClick={() => handleNumClick(0)}
               className="w-16 h-16 rounded-full bg-white/50 hover:bg-white shadow-sm font-bold text-xl text-gray-700 active:scale-95 transition-all mx-auto flex items-center justify-center"
             >
               0
             </button>
           </div>
           <div className="col-start-3 flex items-center justify-center">
              <button 
                onClick={handleBackspace}
                className="w-16 h-16 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-90 transition-transform"
              >
                <i className="fas fa-backspace text-xl"></i>
              </button>
           </div>
         </div>

         {error && (
           <p className="text-center text-red-500 text-xs font-bold mt-6 animate-pulse">
             Oops! Wrong passcode 🙈
           </p>
         )}
      </div>
    </div>
  );
};

export default LockScreen;