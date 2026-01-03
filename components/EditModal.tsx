import React, { useState } from 'react';
import { VisionItem } from '../types';
import StickyNote from './StickyNote';
import Polaroid from './Polaroid';

interface EditModalProps {
  item: VisionItem;
  stickers?: string[];
  onSave: (item: VisionItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const NOTE_COLORS = ['bg-pink-100', 'bg-blue-100', 'bg-yellow-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-rose-200', 'bg-white'];

const FONT_SIZES = [
  { label: 'XS', class: 'text-xs' },
  { label: 'S', class: 'text-sm' },
  { label: 'M', class: 'text-base' },
  { label: 'L', class: 'text-lg' },
  { label: 'XL', class: 'text-xl' },
  { label: '2XL', class: 'text-2xl' },
  { label: '3XL', class: 'text-3xl' },
];

const EditModal: React.FC<EditModalProps> = ({ item, stickers, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState<VisionItem>({ 
    ...item, 
    scale: item.scale || 1,
    fontSize: item.fontSize || 'text-lg' // Default
  });

  // Update formData when input changes
  const handleChange = (field: keyof VisionItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Rotation slider handler
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    handleChange('rotation', `rotate-[${val}deg]`);
  };

  // Scale slider handler
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleChange('scale', val);
  };

  // Font Size slider handler
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    handleChange('fontSize', FONT_SIZES[index].class);
  };

  const currentFontSizeIndex = FONT_SIZES.findIndex(f => f.class === (formData.fontSize || 'text-lg'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        
        {/* Preview Section - Fixed height on mobile (35%), Flexible on desktop. Hidden for Journal items. */}
        {formData.type !== 'journal' && (
          <div className="flex-none h-[35%] md:h-auto md:flex-1 bg-gray-100 p-2 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Double wrapper: Outer scales down the whole preview on mobile, Inner handles user scale */}
            <div className="scale-[0.6] sm:scale-75 md:scale-100 transition-transform duration-300 flex items-center justify-center h-full w-full">
              <div className="transition-all duration-300" style={{ transform: `scale(${formData.scale})` }}>
                {formData.type === 'image' ? (
                  <div style={{ width: '180px' }}> {/* Enforce consistent width in preview for images */}
                    <Polaroid 
                        src={formData.content} 
                        caption={formData.title || ''} 
                        rotation={formData.rotation || 'rotate-0'} 
                        sticker={formData.sticker}
                    />
                  </div>
                ) : (
                  <StickyNote 
                    text={formData.content} 
                    color={formData.color || 'bg-white'} 
                    title={formData.title} 
                    date={formData.date} 
                    sticker={formData.sticker} 
                    rotation={formData.rotation || 'rotate-0'} 
                    fontSize={formData.fontSize}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Form Section - Scrollable, takes remaining height */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white">
          <div className="flex justify-between items-center mb-2 md:mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
            <h3 className="text-lg md:text-2xl font-bold text-gray-800">Customize Item</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <i className="fas fa-times text-lg md:text-xl"></i>
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            
            {/* Generic Title Field */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Title</label>
              <input 
                type="text" 
                value={formData.title || ''} 
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2 border-2 border-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all font-medium text-gray-800 shadow-sm text-sm"
                placeholder={formData.type === 'image' ? "Image Caption..." : "Note Title..."}
              />
            </div>

            {/* Note Fields */}
            {(formData.type === 'note' || formData.type === 'journal') && (
              <>
                 <div>
                   <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">
                     {formData.type === 'journal' ? 'Journal Entry' : 'Note Text'}
                   </label>
                   <textarea 
                     value={formData.content} 
                     onChange={(e) => handleChange('content', e.target.value)}
                     className="w-full h-40 md:h-60 bg-white rounded-xl px-3 py-2 border-2 border-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none resize-none font-handwriting text-base text-gray-700 shadow-sm leading-relaxed"
                     placeholder="Write your thoughts..."
                   />
                 </div>
              </>
            )}

            {/* Common Fields */}
            <div>
                <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Date</label>
                <input 
                    type="text" 
                    value={formData.date || ''} 
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full bg-white rounded-xl px-3 py-2 border-2 border-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none font-medium text-gray-800 shadow-sm text-sm"
                />
            </div>

            {/* Sticker Grid */}
            <div>
                <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Sticker</label>
                {stickers ? (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200 scrollbar-thin">
                        {stickers.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleChange('sticker', formData.sticker === emoji ? '' : emoji)}
                                className={`text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-pink-100 transition-all flex-shrink-0 ${formData.sticker === emoji ? 'bg-pink-200 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={formData.sticker || ''}
                        onChange={(e) => handleChange('sticker', e.target.value)}
                        placeholder="e.g. 🌟"
                        className="w-full bg-white rounded-xl px-4 py-2 border-2 border-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-center text-lg shadow-sm"
                    />
                )}
            </div>

            {formData.type === 'note' && (
            <div>
                <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Color</label>
                <div className="flex gap-2 flex-wrap bg-gray-50 p-2 rounded-xl border border-gray-200">
                {NOTE_COLORS.map(c => (
                    <button 
                    key={c}
                    onClick={() => handleChange('color', c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${c} ${formData.color === c ? 'border-gray-600 scale-110 shadow-md' : 'border-gray-300 hover:scale-110'}`}
                    />
                ))}
                </div>
            </div>
            )}

            {/* Image Fields */}
            {formData.type === 'image' && (
              <div className="animate-fadeIn">
                 <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Image URL</label>
                 <input 
                   type="text" 
                   value={formData.content} 
                   onChange={(e) => handleChange('content', e.target.value)}
                   className="w-full bg-white rounded-xl px-4 py-2 border-2 border-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-xs text-gray-600 font-mono shadow-sm"
                   placeholder="https://..."
                 />
               </div>
            )}

            {/* Sliders Grid */}
            {formData.type !== 'journal' && (
            <div className="grid grid-cols-2 gap-3">
                {/* Rotation Slider */}
                <div>
                   <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Tilt</label>
                   <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                       <input 
                         type="range" 
                         min="-15" 
                         max="15" 
                         step="1"
                         defaultValue={formData.rotation ? parseInt(formData.rotation.match(/-?\d+/)?.[0] || '0') : 0}
                         onChange={handleRotationChange}
                         className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                         <span>-15°</span>
                         <span>0°</span>
                         <span>15°</span>
                       </div>
                   </div>
                </div>

                {/* Scale Slider */}
                <div>
                   <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Size</label>
                   <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                       <input 
                         type="range" 
                         min="0.5" 
                         max="1.5" 
                         step="0.1"
                         value={formData.scale || 1}
                         onChange={handleScaleChange}
                         className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                         <span>Small</span>
                         <span>Normal</span>
                         <span>Big</span>
                       </div>
                   </div>
                </div>

                {/* Font Size Slider - Only for Notes */}
                {formData.type === 'note' && (
                  <div className="col-span-2">
                     <label className="block text-[10px] font-extrabold text-gray-600 uppercase mb-1 tracking-wide">Text Size</label>
                     <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                         <input 
                           type="range" 
                           min="0" 
                           max={FONT_SIZES.length - 1} 
                           step="1"
                           value={currentFontSizeIndex === -1 ? 3 : currentFontSizeIndex}
                           onChange={handleFontSizeChange}
                           className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                         />
                         <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                           {FONT_SIZES.map((fs, idx) => (
                             <span key={fs.label} className={currentFontSizeIndex === idx ? 'text-rose-500 font-black' : ''}>{fs.label}</span>
                           ))}
                         </div>
                     </div>
                  </div>
                )}
            </div>
            )}

            {/* Actions */}
            <div className="pt-4 mt-2 border-t border-gray-100 flex gap-3 pb-4">
              <button 
                onClick={() => onDelete(item.id)}
                className="px-4 py-2.5 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 font-bold transition-colors flex items-center gap-2 text-xs md:text-sm"
              >
                <i className="fas fa-trash-alt"></i> Delete
              </button>
              <div className="flex-1"></div>
              <button 
                onClick={onClose}
                className="px-4 md:px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-colors text-xs md:text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSave(formData)}
                className="px-5 md:px-6 py-2.5 rounded-xl text-white bg-rose-500 hover:bg-rose-600 font-bold shadow-lg transition-transform hover:scale-105 text-xs md:text-sm"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;