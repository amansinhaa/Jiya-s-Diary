import React, { useState, useEffect } from 'react';
import { VisionItem, ChatMessage } from '../types';

interface AppData {
  items: VisionItem[];
  headerConfig: any;
  chatMessages: ChatMessage[];
  version: number;
}

interface DataManagementModalProps {
  currentData: {
    items: VisionItem[];
    headerConfig: any;
    chatMessages: ChatMessage[];
  };
  onRestore: (data: any) => void;
  onClose: () => void;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ currentData, onRestore, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importString, setImportString] = useState('');
  const [exportString, setExportString] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [error, setError] = useState('');

  useEffect(() => {
    // Generate export string on mount
    const data: AppData = {
      ...currentData,
      version: 1
    };
    setExportString(JSON.stringify(data, null, 2));
  }, [currentData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportString);
      setCopyStatus('Copied! ✅');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
    }
  };

  const handleImport = () => {
    try {
      setError('');
      if (!importString.trim()) {
        setError('Please paste the data code first.');
        return;
      }
      
      const parsedData = JSON.parse(importString);
      
      // Basic validation
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        throw new Error("Invalid data format: missing items");
      }

      onRestore(parsedData);
      onClose();
    } catch (err) {
      setError('Invalid data code. Please ensure you copied the entire text.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 font-handwriting">Sync & Backup ☁️</h3>
            <p className="text-sm text-gray-500 mt-1">Move your vision board between devices</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'export' ? 'text-rose-500 border-b-2 border-rose-500 bg-white' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
          >
            <i className="fas fa-upload mr-2"></i> Save (Export)
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'import' ? 'text-rose-500 border-b-2 border-rose-500 bg-white' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
          >
            <i className="fas fa-download mr-2"></i> Load (Import)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white flex-1">
          
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <p className="text-sm text-blue-800 leading-relaxed">
                  To move your board to another device (like from Phone to Laptop), <strong>Copy</strong> the code below and <strong>Paste</strong> it into the "Load" tab on your other device. <br/>
                  <span className="font-bold text-blue-900 text-xs mt-1 block">Includes: Images, Journal & Chat history.</span>
                </p>
              </div>
              
              <div className="relative">
                <textarea 
                  readOnly 
                  value={exportString}
                  className="w-full h-48 bg-gray-800 text-green-400 font-mono text-xs p-4 rounded-xl resize-none focus:outline-none scrollbar-thin"
                />
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  {copyStatus}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
               <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start">
                <i className="fas fa-exclamation-triangle text-orange-500 mt-1"></i>
                <p className="text-sm text-orange-800 leading-relaxed">
                  <strong>Warning:</strong> Restoring data will overwrite your current board on this device. Make sure you have backed up any important changes first.
                </p>
              </div>

              <textarea 
                value={importString}
                onChange={(e) => setImportString(e.target.value)}
                placeholder="Paste the code from your other device here..."
                className="w-full h-48 bg-gray-50 border-2 border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 text-gray-700 font-mono text-xs p-4 rounded-xl resize-none focus:outline-none scrollbar-thin transition-all"
              />
              
              {error && (
                <p className="text-red-500 text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-times-circle"></i> {error}
                </p>
              )}

              <button 
                onClick={handleImport}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
              >
                <i className="fas fa-sync-alt"></i> Restore My Board
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;