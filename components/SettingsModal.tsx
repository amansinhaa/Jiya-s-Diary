import React from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
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
          
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-sm text-blue-600 font-medium">
                Gemini AI features are enabled via your Environment API Key.
            </p>
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