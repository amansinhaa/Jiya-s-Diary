import React, { useState } from 'react';
import { saveFirebaseConfig, clearFirebaseConfig, getCurrentConnectionStatus } from '../services/storageService';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const isConnected = getCurrentConnectionStatus();

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete ALL your items, journals, and chat history. This cannot be undone.")) {
      localStorage.removeItem('jiya_vision_items');
      localStorage.removeItem('jiya_header_config');
      localStorage.removeItem('jiya_chat_history');
      window.location.reload();
    }
  };

  const handleSaveConfig = () => {
    try {
        const config = JSON.parse(configJson);
        if(!config.apiKey || !config.projectId) {
            alert("Invalid config: apiKey and projectId are required.");
            return;
        }
        saveFirebaseConfig(config);
    } catch (e) {
        alert("Invalid JSON format. Please copy the object directly from Firebase Console.");
    }
  };

  const handleDisconnect = () => {
      if(window.confirm("Disconnect from Cloud? This will revert to Local Storage.")) {
          clearFirebaseConfig();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 font-handwriting">Settings ⚙️</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">
                Gemini AI features are enabled via your Environment API Key.
            </p>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* Cloud Sync Section */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="block text-xs font-extrabold text-purple-500 uppercase tracking-wide">
                  Cloud Sync (Firebase)
                </label>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {isConnected ? 'Connected' : 'Offline'}
                </span>
             </div>
             
             {!isConnected ? (
                 !showSyncSetup ? (
                     <button 
                       onClick={() => setShowSyncSetup(true)}
                       className="w-full py-3 border-2 border-purple-100 text-purple-500 font-bold rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm"
                     >
                       <i className="fas fa-cloud"></i> Setup Cloud Sync
                     </button>
                 ) : (
                     <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fadeIn">
                         <p className="text-xs text-purple-800 mb-2">Paste your Firebase Config JSON below to enable cross-device syncing:</p>
                         <textarea 
                           value={configJson}
                           onChange={(e) => setConfigJson(e.target.value)}
                           placeholder='{"apiKey": "...", "authDomain": "...", ...}'
                           className="w-full h-24 bg-white rounded-lg p-2 text-xs font-mono border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 mb-3"
                         />
                         <div className="flex gap-2">
                             <button 
                               onClick={() => setShowSyncSetup(false)}
                               className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                             >
                               Cancel
                             </button>
                             <button 
                               onClick={handleSaveConfig}
                               className="flex-1 py-2 text-xs font-bold text-white bg-purple-500 hover:bg-purple-600 rounded-lg shadow-sm"
                             >
                               Connect & Reload
                             </button>
                         </div>
                     </div>
                 )
             ) : (
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                     <p className="text-sm text-green-800 font-bold mb-1 flex items-center gap-2">
                         <i className="fas fa-check-circle"></i> Sync Active
                     </p>
                     <p className="text-xs text-green-600 mb-3">Your vision board is syncing to the cloud.</p>
                     <button 
                       onClick={handleDisconnect}
                       className="w-full py-2 bg-white text-red-500 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-50"
                     >
                       Disconnect
                     </button>
                 </div>
             )}
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
                Data is stored locally on your device unless Cloud Sync is enabled.
            </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;