import React, { useState, useEffect } from 'react';
import { updateAIKey } from '../services/geminiService';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('jiya_gemini_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      updateAIKey(apiKey.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete ALL your items, journals, and chat history. This cannot be undone.")) {
      localStorage.removeItem('jiya_vision_items');
      localStorage.removeItem('jiya_header_config');
      localStorage.removeItem('jiya_chat_history');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 font-handwriting">Settings ⚙️</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* API Key Section */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Google Gemini API Key
            </label>
            <p className="text-xs text-gray-400 leading-relaxed">
              Required for AI features (Bestie Chat, Study Plans, Image Gen). 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline ml-1 font-bold">
                Get a free key here.
              </a>
            </p>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your AI Studio Key here..."
                className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-rose-400 focus:outline-none"
              />
              <button 
                onClick={handleSave}
                className={`px-4 py-2 rounded-xl font-bold text-white transition-all ${isSaved ? 'bg-green-500' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                {isSaved ? <i className="fas fa-check"></i> : 'Save'}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* Danger Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-red-400 uppercase tracking-wide">
              Danger Zone
            </label>
            <button 
              onClick={handleReset}
              className="w-full py-3 border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <i className="fas fa-trash-alt"></i> Reset All App Data
            </button>
          </div>

        </div>
        
        <div className="bg-gray-50 p-4 text-center">
            <p className="text-[10px] text-gray-400">
                Data is stored locally on your device. <br/>
                Use "Sync" to move data between devices.
            </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;