import React, { useState } from 'react';

interface HeaderConfig {
  title: string;
  subtitle: string;
  hashtags: string[];
}

interface HeaderEditModalProps {
  config: HeaderConfig;
  onSave: (config: HeaderConfig) => void;
  onClose: () => void;
}

const HeaderEditModal: React.FC<HeaderEditModalProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState(config);
  const [hashtagInput, setHashtagInput] = useState(config.hashtags.join(' '));

  const handleSave = () => {
    // Parse hashtags from string
    const tags = hashtagInput.split(' ').map(t => t.trim()).filter(t => t.length > 0);
    // Ensure they start with #
    const formattedTags = tags.map(t => t.startsWith('#') ? t : `#${t}`);
    
    onSave({
      ...formData,
      hashtags: formattedTags
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-pink-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 font-handwriting text-center">Edit Header ✨</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-2 tracking-wide">Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-white rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none font-bold text-rose-600 shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-2 tracking-wide">Subtitle</label>
            <input 
              type="text" 
              value={formData.subtitle} 
              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              className="w-full bg-white rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-gray-700 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-2 tracking-wide">Hashtags</label>
            <input 
              type="text" 
              value={hashtagInput} 
              onChange={(e) => setHashtagInput(e.target.value)}
              placeholder="#goals #2026"
              className="w-full bg-white rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-rose-500 font-medium shadow-sm"
            />
            <p className="text-[10px] text-gray-400 mt-1 pl-1">Separate with spaces</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl text-white bg-rose-500 font-bold hover:bg-rose-600 shadow-lg transition-transform hover:scale-105">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default HeaderEditModal;