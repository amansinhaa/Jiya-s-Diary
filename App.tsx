import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VisionItem, ChatMessage } from './types';
import StickyNote from './components/StickyNote';
import Polaroid from './components/Polaroid';
import EditModal from './components/EditModal';
import HeaderEditModal from './components/HeaderEditModal';
import DataManagementModal from './components/DataManagementModal';
import SettingsModal from './components/SettingsModal';
import LockScreen from './components/LockScreen';
import { getBestieAdvice, generateStudyPlan, generateManifestationImage } from './services/geminiService';
import { createCloudBoard, getCloudBoard, updateCloudBoard, uploadMedia, subscribeToBoard, getCurrentConnectionStatus, uploadBase64 } from './services/storageService';
import ReactMarkdown from 'react-markdown';

const DEFAULT_BOARD_ID = 'board_mjy9gx8m';

const INITIAL_ITEMS: VisionItem[] = [
  { id: '1', type: 'note', content: 'London 2026 🇬🇧\nWalking by the Thames', title: 'Dream Trip', color: 'bg-blue-100', rotation: '-rotate-2', sticker: '✈️', date: 'Summer 2026', scale: 1, fontSize: 'text-xl' },
  { id: '2', type: 'image', content: 'https://images.unsplash.com/photo-1532906619279-a764d89a445d?w=800&q=80', title: 'F1 Race Day 🏎️', rotation: 'rotate-3', scale: 1, sticker: '🏎️' },
  { id: '3', type: 'goal', content: '9.5 CGPA', title: 'Academic Weapon', color: 'bg-pink-100', rotation: '-rotate-1', sticker: '📚', scale: 1, fontSize: 'text-2xl' },
  { id: '4', type: 'note', content: 'Gajar ka Halwa &\nBiryani Feast', title: 'Soul Food', color: 'bg-orange-100', rotation: 'rotate-1', sticker: '🥘', date: 'Always', scale: 1, fontSize: 'text-lg' },
  { id: '6', type: 'image', content: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', title: 'Himalayan Trek', rotation: '-rotate-3', scale: 1, sticker: '🏔️' },
  { id: '7', type: 'note', content: 'Healthy Body\nPilates & Greens', title: 'That Girl', color: 'bg-green-100', rotation: 'rotate-1', sticker: '🧘‍♀️', scale: 1, fontSize: 'text-lg' },
  { id: '8', type: 'note', content: 'A love that feels\nlike home ❤️', title: 'Relationship', color: 'bg-rose-200', rotation: '-rotate-2', sticker: '💌', scale: 1, fontSize: 'text-lg' },
  { id: '9', type: 'quote', content: '2026 is my year', color: 'bg-purple-200', rotation: 'rotate-6', scale: 1, fontSize: 'text-2xl' },
  { id: '10', type: 'image', content: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', title: 'IIM Bound', rotation: '-rotate-1', scale: 1, sticker: '🎓' },
  { id: '11', type: 'journal', content: 'Today I managed to study for 4 hours straight! It felt amazing to be productive. The CAT prep is intense but I am starting to get the hang of LRDI sets. Manifesting that seat at IIM A! ✨', title: 'Productive Day', date: 'Oct 24, 2025', sticker: '💪', scale: 1 },
];

const INITIAL_HEADER = {
  title: "Jiya's Era ✨",
  subtitle: "Undergrad • Future CEO • IIM Aspirant",
  hashtags: ["#LondonCalling", "#F1Girlie", "#Foodie", "#FitFab"]
};

const STICKERS = [
  '😊', '😂', '🥰', '😍', '😎', '🤓', '🥺', '😭', '😤', '😡', '🤯', '😴',
  '🤒', '🥳', '🥴', '😇', '🤠', '🤡', '👻', '💀', '👽', '🤖', '💩', '💪',
  '🙏', '✨', '💖', '💔', '💯', '💢', '💤', '👀', '🧠', '🫀', '💅', '💄',
  '🛍️', '🎓', '💻', '📚', '✏️', '🎨', '🎤', '🎧', '🎮', '🎬', '📸', '📹',
  '🍔', '🍕', '🍩', '☕', '🍷', '🍺', '🧘‍♀️', '🚴‍♀️', '🏆', '✈️', '🚀', '🌍',
  '🇬🇧', '🏎️', '🥘', '🏔️'
];

const NOTE_COLORS = ['bg-pink-100', 'bg-blue-100', 'bg-yellow-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-rose-200'];

const JOURNAL_STICKERS = STICKERS; 

const FONT_SIZES = [
  { label: 'XS', class: 'text-xs' },
  { label: 'S', class: 'text-sm' },
  { label: 'M', class: 'text-base' },
  { label: 'L', class: 'text-lg' },
  { label: 'XL', class: 'text-xl' },
  { label: '2XL', class: 'text-2xl' },
  { label: '3XL', class: 'text-3xl' },
];

// Image compression utility - Optimized: No Resize, Just Quality Compression
const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // KEEP ORIGINAL DIMENSIONS
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, img.width, img.height);
        
        // Compress quality to 0.7 (70%)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', 0.7); 
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const App: React.FC = () => {
  // --- Lock Screen State ---
  const [isLocked, setIsLocked] = useState(false);
  const [lockPasscode, setLockPasscode] = useState<string | null>(null);

  // --- Persistent State Initialization ---
  const [items, setItems] = useState<VisionItem[]>([]);
  const [headerConfig, setHeaderConfig] = useState(INITIAL_HEADER);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'model', text: "Hey Jiya! Ready to manifest that 9.5 CGPA and London trip? ✨", timestamp: new Date() }]);

  // --- Cloud Sync State ---
  const [boardId, setBoardId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Ref for interaction state to use in event listeners without re-triggering effects
  const isInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<any>(null);
  const [isInteractingState, setIsInteractingState] = useState(false); // For UI rendering
  
  const setInteracting = (val: boolean) => {
      isInteractingRef.current = val;
      setIsInteractingState(val);

      // Clear existing timeout
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);

      if (val) {
          // Safety valve: Auto-release interaction lock after 5 seconds of inactivity
          interactionTimeoutRef.current = setTimeout(() => {
              console.log("Auto-releasing stuck interaction lock");
              isInteractingRef.current = false;
              setIsInteractingState(false);
          }, 5000);
      }
  };
  
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'create' | 'journal'>('board');
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Reorder State
  const [isRearranging, setIsRearranging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // For visual hint

  // Journal State
  const [showNewJournalForm, setShowNewJournalForm] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalSticker, setJournalSticker] = useState('');

  // Chat State
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create Mode Unified State
  const [createType, setCreateType] = useState<'note' | 'image'>('note');
  const [createContent, setCreateContent] = useState(''); 
  const [createTitle, setCreateTitle] = useState('');
  const [createDate, setCreateDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const [createSticker, setCreateSticker] = useState('');
  const [createColor, setCreateColor] = useState('bg-pink-100');
  const [createScale, setCreateScale] = useState<number>(1);
  const [createRotation, setCreateRotation] = useState<number>(0);
  const [createFontSize, setCreateFontSize] = useState<string>('text-lg');
  const [createImageFit, setCreateImageFit] = useState<'cover' | 'contain'>('cover');
  
  // AI Image Gen
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Debounce Ref for Auto Save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for tracking local state during updates
  const itemsRef = useRef(items);
  const headerRef = useRef(headerConfig);
  const chatRef = useRef(chatMessages);

  // Update refs when state changes
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { headerRef.current = headerConfig; }, [headerConfig]);
  useEffect(() => { chatRef.current = chatMessages; }, [chatMessages]);

  const updateUrlSafe = (id: string) => {
    try {
      const newUrl = `${window.location.pathname}?id=${id}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } catch (e) { }
  };

  // --- Initialization & URL Parsing ---
  const initApp = async () => {
    // Check Lock Status
    try {
      const lockConfig = localStorage.getItem('jiya_app_lock');
      if (lockConfig) {
        const { enabled, code } = JSON.parse(lockConfig);
        if (enabled && code) {
          setIsLocked(true);
          setLockPasscode(code);
        }
      }
    } catch (e) {
      console.error("Failed to parse lock config");
    }

    setIsLoading(true);
    setLoadError('');
    setIsCloudConnected(getCurrentConnectionStatus());
    
    const params = new URLSearchParams(window.location.search);
    let idFromUrl = params.get('id');

    // Default to the specific board ID if none provided
    if (!idFromUrl) {
      idFromUrl = DEFAULT_BOARD_ID;
      updateUrlSafe(idFromUrl);
    }

    if (idFromUrl) {
      await loadBoardData(idFromUrl);
    } else {
      await createNewBoard();
    }
    setIsLoading(false);
  };

  const loadBoardData = async (id: string) => {
      try {
        const data = await getCloudBoard(id);
        
        // Filter out the "Do it tired" note if it exists in data
        let loadedItems = data.items || [];
        if (Array.isArray(loadedItems)) {
             loadedItems = loadedItems.filter((i: VisionItem) => 
               !i.content.includes("Do it tired.\nDo it sad.\nJust do it.")
             );
        }

        setItems(loadedItems);
        if (data.headerConfig) setHeaderConfig(data.headerConfig);
        if (data.chatMessages) {
            const fixedMessages = data.chatMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setChatMessages(fixedMessages);
        }
        setBoardId(id);
        localStorage.setItem('jiya_board_id', id);
        updateUrlSafe(id);
        setIsDataLoaded(true);
        setHasUnsavedChanges(false); 
      } catch (err: any) {
        console.warn("Load failed", err);
        if (err.message === "Board not found") {
           // Self-Healing
           if (id === DEFAULT_BOARD_ID) {
              console.log("Default board not found, creating it now...");
              try {
                  await createCloudBoard({
                      items: INITIAL_ITEMS,
                      headerConfig: INITIAL_HEADER,
                      chatMessages: [{ role: 'model', text: "Hey Jiya! Ready to manifest that 9.5 CGPA and London trip? ✨", timestamp: new Date() }]
                  }, DEFAULT_BOARD_ID);
                  
                  await loadBoardData(DEFAULT_BOARD_ID);
                  return;
              } catch (createErr) {
                  console.error("Failed to auto-create default board", createErr);
                  setLoadError("Could not initialize Jiya's board.");
              }
           } else if (navigator.onLine) {
               await createNewBoard();
           } else {
               setLoadError("You are offline. Could not load shared board.");
           }
        } else {
           setLoadError("Could not load board. Please check connection.");
        }
      }
  }

  const createNewBoard = async () => {
     try {
        const newId = await createCloudBoard({
          items: INITIAL_ITEMS,
          headerConfig: INITIAL_HEADER,
          chatMessages: [{ role: 'model', text: "Hey Jiya! Ready to manifest that 9.5 CGPA and London trip? ✨", timestamp: new Date() }]
        });
        setItems(INITIAL_ITEMS);
        setBoardId(newId);
        localStorage.setItem('jiya_board_id', newId);
        updateUrlSafe(newId);
        setIsDataLoaded(true);
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error("Creation failed", e);
        setLoadError("Could not initialize app.");
      }
  };

  useEffect(() => {
    initApp();
  }, []);

  // --- Real-Time Sync (Firestore Subscription) ---
  useEffect(() => {
    if (!boardId || !isDataLoaded) return;

    const unsubscribe = subscribeToBoard(boardId, (newData) => {
      if (isInteractingRef.current) return;

      let incomingItems = newData.items || [];
      if(Array.isArray(incomingItems)) {
         incomingItems = incomingItems.filter((i: VisionItem) => !i.content.includes("Do it tired.\nDo it sad.\nJust do it."));
      }

      if (incomingItems) setItems(incomingItems);
      if (newData.headerConfig) setHeaderConfig(newData.headerConfig);
      if (newData.chatMessages) {
         const fixedMessages = newData.chatMessages.map((msg: any) => ({
             ...msg,
             timestamp: new Date(msg.timestamp)
         }));
         setChatMessages(fixedMessages);
      }
    });

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && boardId) {
            getCloudBoard(boardId).then((data) => {
                 let loadedItems = data.items || [];
                 if (Array.isArray(loadedItems)) {
                      loadedItems = loadedItems.filter((i: VisionItem) => 
                        !i.content.includes("Do it tired.\nDo it sad.\nJust do it.")
                      );
                      setItems(loadedItems);
                 }
                 if (data.headerConfig) setHeaderConfig(data.headerConfig);
            }).catch(e => console.warn("Background refresh failed", e));
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes(boardId)) {
         try {
           const newData = JSON.parse(e.newValue || '{}');
           if (newData.items) setItems(newData.items);
           if (newData.headerConfig) setHeaderConfig(newData.headerConfig);
         } catch (err) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
       unsubscribe();
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       window.removeEventListener('storage', handleStorageChange);
    };
  }, [boardId, isDataLoaded]); 


  // --- Auto Save Effects ---
  useEffect(() => {
    if (boardId && isDataLoaded && hasUnsavedChanges) {
      setSaveStatus('Saving...');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
            await updateCloudBoard(boardId, {
                items,
                headerConfig,
                chatMessages,
                lastUpdated: Date.now()
            });
            setSaveStatus('Saved');
            setHasUnsavedChanges(false); 
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
          console.error("Auto-save failed", error);
          setSaveStatus('Retry');
        }
      }, 800); 
    }
  }, [items, headerConfig, chatMessages, boardId, isDataLoaded, hasUnsavedChanges]);

  const markDirty = () => setHasUnsavedChanges(true);
  
  const handleRetrySave = async () => {
      if (!boardId) return;
      setSaveStatus('Saving...');
      try {
          await updateCloudBoard(boardId, {
              items,
              headerConfig,
              chatMessages,
              lastUpdated: Date.now()
          });
          setSaveStatus('Saved');
          setHasUnsavedChanges(false);
          setTimeout(() => setSaveStatus(''), 2000);
      } catch (e) {
          setSaveStatus('Retry');
          alert("Save failed. The board might be too large or connection is unstable.");
      }
  };

  // --- Handlers ---
  const handleUpdateItem = (updatedItem: VisionItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
    markDirty();
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      setItems(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      markDirty();
    }
  };

  const handleCreateTypeChange = (type: 'note' | 'image') => {
      if (type !== createType) {
          setCreateType(type);
          setCreateContent(''); // Clear content to avoid URL showing in note text area
      }
  };

  const handleResetCreateForm = () => {
      setCreateContent('');
      setCreateTitle('');
      setCreateSticker('');
      setPrompt('');
      setCreateScale(1);
      setCreateRotation(0);
      setCreateFontSize('text-lg');
      setCreateColor('bg-pink-100');
      setCreateImageFit('cover');
  };

  const handleAddItem = async () => {
    if (!createContent.trim()) return;
    
    let finalContent = createContent;
    if (createContent.startsWith('data:image')) {
        setIsUploading(true);
        try {
            finalContent = await uploadBase64(createContent);
        } catch (e) {
            console.error("Failed to upload generated image", e);
        } finally {
            setIsUploading(false);
        }
    }

    const newItem: VisionItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: createType,
      content: finalContent,
      title: createTitle || (createType === 'image' ? 'Vibes' : 'Untitled'),
      date: createDate,
      sticker: createSticker,
      color: createColor,
      rotation: `rotate-[${createRotation}deg]`,
      scale: createScale,
      fontSize: createFontSize,
      imageFit: createImageFit,
    };

    setItems(prev => [newItem, ...prev]);
    setActiveTab('board');
    handleResetCreateForm();
    markDirty();
  };

  const handleRestoreData = (data: any) => {
    if (data.items) setItems(data.items);
    if (data.headerConfig) setHeaderConfig(data.headerConfig);
    if (data.chatMessages) {
       const fixedMessages = data.chatMessages.map((msg: any) => ({
         ...msg,
         timestamp: new Date(msg.timestamp)
       }));
       setChatMessages(fixedMessages);
    }
    markDirty(); 
    alert('Vision Board Restored Successfully! ✨');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // Compress image before upload (No resize, just quality)
        const compressedBlob = await compressImage(file);
        const uploadedUrl = await uploadMedia(compressedBlob);
        setCreateContent(uploadedUrl);
      } catch (err: any) {
        console.error("Upload failed", err);
        alert("Image upload failed: " + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // ... Chat & Journal Handlers ...
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMsg: ChatMessage = { role: 'user', text: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newMsg]);
    setUserInput('');
    setIsTyping(true);
    markDirty(); 
    try {
      const lowerInput = newMsg.text.toLowerCase();
      let responseText = "";
      if (lowerInput.includes('study plan') || lowerInput.includes('schedule') || lowerInput.includes('cat prep')) {
         responseText = await generateStudyPlan(newMsg.text);
      } else {
         responseText = await getBestieAdvice(newMsg.text);
      }
      setChatMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
      markDirty();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateManifestationImage(prompt);
      if (base64Image) {
        setCreateContent(base64Image); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const addJournalEntry = () => {
    if (!journalText.trim()) return;
    setInteracting(true); 
    const newItem: VisionItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'journal',
      content: journalText,
      title: journalTitle || 'Dear Diary',
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      sticker: journalSticker,
      rotation: 'rotate-0',
      scale: 1,
    };
    setItems(prev => [newItem, ...prev]);
    setShowNewJournalForm(false);
    setJournalText('');
    setJournalTitle('');
    setJournalSticker('');
    markDirty();
    setTimeout(() => { }, 2000);
  };

  const handleInstallClick = () => {
    if (!installPrompt) {
      alert("To install, use your browser's 'Add to Home Screen' or 'Install App' option!");
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      setInstallPrompt(null);
    });
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setInteracting(true); 
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
    if (isRearranging) {
        setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
      setInteracting(false);
      setDraggedItemIndex(null);
      setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setInteracting(false); 
    setDragOverIndex(null);
    
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const boardItems = items.filter(i => i.type !== 'journal');
    const draggedItem = boardItems[draggedItemIndex];
    const targetItem = boardItems[targetIndex];
    let newItems = [...items];
    const realDragIndex = newItems.findIndex(i => i.id === draggedItem.id);
    const currentTargetIndex = newItems.findIndex(i => i.id === targetItem.id);
    newItems.splice(realDragIndex, 1);
    newItems.splice(currentTargetIndex, 0, draggedItem);
    setItems(newItems);
    setDraggedItemIndex(null);
    markDirty();
  };

  const getRotateTransform = (rot?: string) => {
    if (!rot) return '';
    const match = rot.match(/rotate-\[?(-?\d+)(deg)?\]?/);
    if (match) return `rotate(${match[1]}deg)`;
    const standardMatch = rot.match(/(-?)rotate-(\d+)/);
    if (standardMatch) {
      const sign = standardMatch[1] === '-' ? -1 : 1;
      const val = parseInt(standardMatch[2]);
      return `rotate(${sign * val}deg)`;
    }
    return '';
  };

  if (isLocked && lockPasscode) {
    return (
      <LockScreen 
        passcode={lockPasscode} 
        onUnlock={() => setIsLocked(false)} 
        stickers={STICKERS}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdf2f8] flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4 animate-bounce">✨</div>
        <h1 className="text-2xl font-handwriting text-rose-500 mb-2">Syncing your Vision...</h1>
      </div>
    );
  }

  if (loadError) {
      return (
        <div className="min-h-screen bg-[#fdf2f8] flex flex-col items-center justify-center p-6 text-center">
            <i className="fas fa-wifi text-4xl text-rose-300 mb-4"></i>
            <h1 className="text-xl font-bold text-gray-700 mb-2">{loadError}</h1>
            <p className="text-sm text-gray-500 mb-6">We couldn't reach the cloud board. This usually happens if the link is incorrect or internet is spotty.</p>
            <button onClick={() => window.location.reload()} className="bg-rose-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Try Again</button>
        </div>
      );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-[#fdf2f8]">
       {/* Ambient blobs - Adjusted for screenshot match */}
       <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-10 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 -left-10 w-80 h-80 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
       </div>
       
       {/* Connection Status & Save Indicator */}
       <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
         {saveStatus && (
           <button 
              onClick={saveStatus === 'Retry' ? handleRetrySave : undefined}
              className={`bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 ${saveStatus === 'Retry' ? 'cursor-pointer hover:bg-red-50' : ''}`}
           >
              <span className={`w-2 h-2 rounded-full ${saveStatus === 'Saved' ? 'bg-green-400' : saveStatus === 'Saving...' ? 'bg-yellow-400' : 'bg-red-500'}`}></span>
              <span className={`text-[10px] font-bold uppercase ${saveStatus === 'Retry' ? 'text-red-500' : 'text-gray-500'}`}>{saveStatus}</span>
              {saveStatus === 'Retry' && <i className="fas fa-redo text-xs text-red-400"></i>}
           </button>
         )}

         {!isCloudConnected && (
             <div className="bg-orange-50/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-orange-200 flex items-center gap-2" title="Local Mode">
                 <i className="fas fa-cloud-slash text-orange-400 text-xs"></i>
             </div>
         )}
         {isCloudConnected && (
             <div className="bg-green-50/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-green-200 flex items-center gap-2" title="Cloud Sync Active">
                 <i className="fas fa-cloud text-green-400 text-xs"></i>
             </div>
         )}
       </div>

       {editingItem && (
         <EditModal 
           item={editingItem}
           stickers={STICKERS}
           onSave={handleUpdateItem} 
           onDelete={handleDeleteItem} 
           onClose={() => setEditingItem(null)} 
         />
       )}

       {isEditingHeader && (
         <HeaderEditModal 
           config={headerConfig}
           onSave={(newConfig) => {
             setHeaderConfig(newConfig);
             setIsEditingHeader(false);
             markDirty();
           }}
           onClose={() => setIsEditingHeader(false)}
         />
       )}

       {showDataModal && (
         <DataManagementModal 
           currentData={{ items, headerConfig, chatMessages }}
           onRestore={handleRestoreData}
           onClose={() => setShowDataModal(false)}
         />
       )}

       {showSettingsModal && (
         <SettingsModal onClose={() => setShowSettingsModal(false)} />
       )}

       <header className="relative z-10 p-4 sm:p-6 text-center group cursor-pointer" onClick={() => !isRearranging && setIsEditingHeader(true)}>
         <div className="relative inline-block">
            <h1 className="text-3xl sm:text-5xl font-handwriting text-rose-600 drop-shadow-sm floating">
              {headerConfig.title}
            </h1>
            {!isRearranging && (
              <span className="absolute -top-3 -right-6 sm:-top-4 sm:-right-8 bg-white/80 p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-gray-100 scale-75 sm:scale-100">
                <i className="fas fa-pencil-alt text-sm"></i>
              </span>
            )}
         </div>
         <p className="text-gray-600 mt-2 font-medium text-xs sm:text-base">{headerConfig.subtitle}</p>
         
         <div className="flex justify-center flex-wrap gap-1.5 mt-3 sm:mt-4 text-[10px] sm:text-sm text-rose-500 font-bold tracking-widest uppercase px-4">
            {headerConfig.hashtags.map((tag, i) => (
              <React.Fragment key={i}>
                <span>{tag}</span>{i < headerConfig.hashtags.length - 1 && <span>•</span>}
              </React.Fragment>
            ))}
         </div>
       </header>

       <main className="relative z-10 max-w-7xl mx-auto px-4">
          
          {activeTab === 'board' && (
            <div className="pb-32 mt-2">
              {Array.isArray(items) && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto items-start">
                  {items.filter(i => i.type !== 'journal').map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`relative w-full transition-all duration-200 
                        ${isRearranging ? 'cursor-move hover:opacity-90' : ''} 
                        ${isRearranging && dragOverIndex === index ? 'scale-105 opacity-50' : ''}
                      `}
                      draggable={isRearranging}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onTouchEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className={`flex justify-center relative ${isRearranging ? 'animate-wiggle' : ''} ${isRearranging && dragOverIndex === index ? 'ring-4 ring-rose-300 rounded-lg' : ''}`}>
                        {isRearranging && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="absolute -top-3 -right-3 z-50 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all border-2 border-white"
                          >
                            <i className="fas fa-times text-sm"></i>
                          </button>
                        )}

                        {isRearranging && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                            className="absolute -top-3 -left-3 z-50 w-8 h-8 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all border-2 border-white"
                          >
                            <i className="fas fa-pencil-alt text-xs"></i>
                          </button>
                        )}

                        <div style={{ 
                           transform: `scale(${item.scale || 1}) ${getRotateTransform(item.rotation)}`, 
                           transition: 'transform 0.2s' 
                        }}>
                          {item.type === 'image' ? (
                            <div className="w-40 sm:w-56">
                              <Polaroid 
                                src={item.content} 
                                caption={item.title || 'Vibes'} 
                                rotation="" 
                                sticker={item.sticker}
                                imageFit={item.imageFit}
                                onClick={!isRearranging ? () => setEditingItem(item) : undefined}
                              />
                            </div>
                          ) : (
                            <StickyNote 
                              text={item.content} 
                              color={item.color || 'bg-white'} 
                              title={item.title}
                              date={item.date}
                              sticker={item.sticker}
                              fontSize={item.fontSize}
                              rotation="" 
                              onClick={!isRearranging ? () => setEditingItem(item) : undefined}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-12 text-center space-y-4">
                <div className="inline-flex items-center gap-4 sm:gap-6 bg-white/60 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-full shadow-sm border border-white/50">
                   <button 
                     onClick={handleInstallClick}
                     className="text-gray-500 hover:text-rose-500 font-bold text-xs flex items-center gap-2 transition-colors"
                   >
                     <i className="fas fa-download"></i> <span className="hidden sm:inline">Install</span>
                   </button>
                   <div className="w-px h-4 bg-gray-300"></div>
                   <button 
                     onClick={() => setIsRearranging(!isRearranging)}
                     className={`font-bold text-xs flex items-center gap-2 transition-colors ${isRearranging ? 'text-rose-600 bg-rose-50 px-3 py-1 rounded-full' : 'text-gray-500 hover:text-rose-500'}`}
                   >
                     {isRearranging ? (
                       <><i className="fas fa-check"></i> Done</>
                     ) : (
                       <><i className="fas fa-layer-group"></i> <span>Rearrange</span></>
                     )}
                   </button>
                   <div className="w-px h-4 bg-gray-300"></div>
                   <button 
                     onClick={() => setShowSettingsModal(true)}
                     className="text-gray-500 hover:text-rose-500 font-bold text-xs flex items-center gap-2 transition-colors"
                   >
                     <i className="fas fa-cog"></i>
                   </button>
                </div>
                {isRearranging && (
                   <p className="text-rose-500 font-handwriting mt-4 text-sm font-bold animate-pulse">
                     Drag to move • Tap X to delete • Tap pencil to edit
                   </p>
                )}
              </div>
            </div>
          )}
          
          {/* ... Rest of Tab Logic ... */}
          {activeTab === 'journal' && (
            <div className="max-w-3xl mx-auto pb-24">
               <div className="flex justify-between items-center mb-6 bg-white/50 p-3 sm:p-4 rounded-2xl backdrop-blur-sm">
                  <h2 className="text-xl sm:text-3xl font-handwriting text-rose-600">My Journal 📔</h2>
                  <button 
                    onClick={() => setShowNewJournalForm(!showNewJournalForm)}
                    className="bg-rose-500 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-md flex items-center gap-2 text-sm"
                  >
                    {showNewJournalForm ? <><i className="fas fa-times"></i> Close</> : <><i className="fas fa-pen"></i> New Entry</>}
                  </button>
               </div>

               {showNewJournalForm && (
                 <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl mb-8 animate-fadeIn border-2 border-pink-100">
                    <div className="flex flex-col mb-4">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </span>
                      </div>
                      <div className="mb-4">
                         <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase mb-2">Mood / Sticker</label>
                         <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100 scrollbar-thin">
                            {JOURNAL_STICKERS.map(emoji => (
                              <button 
                                key={emoji}
                                onClick={() => setJournalSticker(journalSticker === emoji ? '' : emoji)}
                                className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-pink-100 transition-all ${journalSticker === emoji ? 'bg-pink-200 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>

                    <input 
                      type="text"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      placeholder="Title of the day..."
                      className="w-full text-lg sm:text-xl font-bold text-gray-800 placeholder-gray-300 border-none focus:ring-0 px-0 bg-transparent mb-2"
                    />
                    <textarea 
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="Start writing here..."
                      className="w-full h-40 bg-gray-50 rounded-xl p-4 border-none focus:ring-2 focus:ring-pink-200 resize-none font-handwriting text-base sm:text-lg leading-relaxed text-gray-700"
                    />
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={addJournalEntry}
                        className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 shadow-md"
                      >
                        Save Entry
                      </button>
                    </div>
                 </div>
               )}

               <div className="space-y-4 sm:space-y-6">
                 {items.filter(i => i.type === 'journal').map((entry) => (
                   <div key={entry.id} className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-6 sm:left-8 bottom-0 w-[2px] bg-red-200 opacity-50"></div>
                      <div className="pl-6 sm:pl-8 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md">
                              {entry.date}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-2">{entry.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            {entry.sticker && <span className="text-2xl sm:text-3xl filter drop-shadow-sm">{entry.sticker}</span>}
                            <button onClick={() => setEditingItem(entry)} className="text-gray-300 hover:text-gray-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                          </div>
                        </div>
                        <p className="font-handwriting text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap mt-2 sm:mt-4">
                          {entry.content}
                        </p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 sm:p-5 border-4 border-dashed border-pink-200">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl sm:text-2xl font-handwriting text-gray-800 text-center flex-1">Manifest Something New</h2>
                 <button onClick={handleResetCreateForm} className="text-gray-400 hover:text-rose-500 text-xs font-bold uppercase" title="Clear All Fields">
                   Reset
                 </button>
               </div>
               
               <div className="space-y-2 animate-fadeIn">
                 <div className="flex bg-pink-100 p-1 rounded-xl mb-2">
                    <button 
                      onClick={() => handleCreateTypeChange('note')}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 ${createType === 'note' ? 'bg-white text-rose-500 shadow-md' : 'text-gray-500 hover:text-rose-400'}`}
                    >
                      <i className="fas fa-sticky-note"></i> Note
                    </button>
                    <button 
                      onClick={() => handleCreateTypeChange('image')}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 ${createType === 'image' ? 'bg-white text-rose-500 shadow-md' : 'text-gray-500 hover:text-rose-400'}`}
                    >
                      <i className="fas fa-image"></i> Image
                    </button>
                 </div>

                 {/* Preview */}
                 <div className="flex justify-center py-1 bg-pink-50/50 rounded-xl mb-2 border border-pink-100 border-dashed min-h-[100px] h-36 items-center overflow-hidden">
                    <div style={{ transform: `scale(${createScale * 0.6})`, transition: 'transform 0.2s' }}>
                      {createType === 'note' ? (
                        <div style={{ transform: `rotate(${createRotation}deg)` }}>
                          <StickyNote 
                            text={createContent || "Your text here..."}
                            title={createTitle || "Title"}
                            date={createDate}
                            sticker={createSticker}
                            color={createColor}
                            fontSize={createFontSize}
                            rotation="" 
                            className="shadow-md"
                          />
                        </div>
                      ) : (
                         createContent ? (
                           <div style={{ transform: `rotate(${createRotation}deg)` }}>
                             <div className="w-40 sm:w-56">
                                <Polaroid 
                                    src={createContent} 
                                    caption={createTitle || "Caption"} 
                                    rotation="" 
                                    sticker={createSticker}
                                    imageFit={createImageFit}
                                />
                             </div>
                           </div>
                         ) : (
                           <div className="text-gray-400 text-center">
                             <i className="fas fa-image text-4xl mb-2 opacity-30"></i>
                             <p className="text-[10px] font-handwriting">Preview will appear here</p>
                           </div>
                         )
                      )}
                    </div>
                 </div>

                 <input 
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder={createType === 'image' ? "Caption" : "Title"}
                    className="w-full bg-pink-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-gray-800 font-bold text-xs sm:text-sm"
                 />
                 
                 {createType === 'note' ? (
                    <textarea 
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder="Write your affirmation or goal..."
                      className="w-full h-16 bg-pink-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-gray-700 resize-none font-handwriting text-base sm:text-lg"
                    />
                 ) : (
                    <div className="space-y-2">
                      <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm">
                        <label className="block text-[8px] font-bold text-rose-400 uppercase mb-1">Upload Image</label>
                        <div className="relative">
                           <input 
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                           />
                           <label 
                             htmlFor="image-upload"
                             className={`flex items-center justify-center w-full px-4 py-1.5 bg-pink-50 text-rose-500 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors border-2 border-dashed border-pink-200 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                           >
                             <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} mr-2 text-sm`}></i>
                             <span className="font-bold text-[10px]">{isUploading ? 'Uploading...' : 'Choose file'}</span>
                           </label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <div className="flex-1">
                             <input 
                               type="text"
                               value={createContent}
                               onChange={(e) => setCreateContent(e.target.value)}
                               placeholder="Or paste Image URL..."
                               className="w-full bg-pink-50 rounded-xl px-3 py-2 focus:ring-2 focus:ring-pink-300 outline-none text-gray-600 text-[10px] font-mono"
                             />
                         </div>
                         <div className="bg-pink-50 rounded-xl p-1 flex">
                            <button
                              onClick={() => setCreateImageFit('cover')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${createImageFit === 'cover' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-rose-400'}`}
                              title="Fill frame (crop)"
                            >
                                Fill
                            </button>
                            <button
                              onClick={() => setCreateImageFit('contain')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${createImageFit === 'contain' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-rose-400'}`}
                              title="Fit image (no crop)"
                            >
                                Fit
                            </button>
                         </div>
                      </div>
                    </div>
                 )}

                 {/* Remaining Create Controls (Date, Color, Sticker, Sliders) */}
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Date</label>
                     <input 
                        type="text"
                        value={createDate}
                        onChange={(e) => setCreateDate(e.target.value)}
                        className="w-full bg-pink-50 rounded-xl px-2 py-1.5 focus:ring-2 focus:ring-pink-300 outline-none text-gray-700 text-xs"
                     />
                   </div>
                   {createType === 'note' && (
                     <div className="flex-1">
                        <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Color</label>
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                           {NOTE_COLORS.map(c => (
                             <button 
                               key={c}
                               onClick={() => setCreateColor(c)}
                               className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-transform ${c} ${createColor === c ? 'border-gray-500 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                             />
                           ))}
                        </div>
                     </div>
                   )}
                 </div>
                 
                 <div>
                    <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Sticker</label>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1 bg-pink-50 rounded-xl border border-pink-100 scrollbar-thin">
                    {STICKERS.map(s => (
                        <button 
                        key={s}
                        onClick={() => setCreateSticker(s === createSticker ? '' : s)}
                        className={`text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-pink-100 transition-all flex-shrink-0 ${createSticker === s ? 'bg-pink-200 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                        >
                        {s}
                        </button>
                    ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Tilt</label>
                      <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm">
                         <input 
                           type="range" 
                           min="-15" 
                           max="15" 
                           step="1"
                           value={createRotation}
                           onChange={(e) => setCreateRotation(parseInt(e.target.value))}
                           className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                         />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Size</label>
                      <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm">
                         <input 
                           type="range" 
                           min="0.5" 
                           max="1.5" 
                           step="0.1"
                           value={createScale}
                           onChange={(e) => setCreateScale(parseFloat(e.target.value))}
                           className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>
                   </div>

                   {createType === 'note' && (
                     <div className="col-span-2">
                       <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Text Size</label>
                       <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm">
                         <input 
                           type="range" 
                           min="0" 
                           max={FONT_SIZES.length - 1} 
                           step="1"
                           value={FONT_SIZES.findIndex(f => f.class === createFontSize)}
                           onChange={(e) => setCreateFontSize(FONT_SIZES[parseInt(e.target.value)].class)}
                           className="w-full accent-rose-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                         />
                         <div className="flex justify-between text-[6px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                           {FONT_SIZES.map((fs, idx) => (
                              <span key={fs.label} className={FONT_SIZES[idx].class === createFontSize ? 'text-rose-500 font-bold' : ''}>{fs.label}</span>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>

                 <button 
                   onClick={handleAddItem}
                   disabled={isUploading}
                   className={`w-full py-2.5 mt-2 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-xl transform transition-transform hover:scale-[1.02] flex justify-center items-center gap-2 text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <i className="fas fa-thumbtack"></i> Pin to Vision Board
                 </button>
               </div>
            </div>
          )}

       </main>

       {/* New Footer Navigation */}
       <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center w-full pointer-events-none">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] px-8 py-3 flex items-center gap-16 relative pointer-events-auto">
             
             {/* Left: Vision */}
             <button 
               onClick={() => setActiveTab('board')}
               className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'board' ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <div className={`p-1.5 rounded-xl ${activeTab === 'board' ? 'bg-rose-50' : ''}`}>
                 <i className="fas fa-th-large text-lg"></i>
               </div>
               <span className="text-[9px] font-bold tracking-widest uppercase">Vision</span>
             </button>

             {/* Right: Journal */}
             <button 
               onClick={() => setActiveTab('journal')}
               className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'journal' ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <div className={`p-1.5 rounded-xl ${activeTab === 'journal' ? 'bg-rose-50' : ''}`}>
                 <i className="fas fa-book text-lg"></i>
               </div>
               <span className="text-[9px] font-bold tracking-widest uppercase">Journal</span>
             </button>

             {/* Center: Create Button (Absolute) */}
             <button 
                onClick={() => setActiveTab('create')}
                className="absolute left-1/2 -top-6 transform -translate-x-1/2 bg-rose-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-rose-200 hover:bg-rose-600 transition-transform hover:scale-110 active:scale-95 border-4 border-[#fdf2f8]"
             >
               <i className="fas fa-plus text-2xl"></i>
             </button>
          </div>
          
          <p className="text-gray-400/80 font-handwriting text-[10px] mt-3 font-medium pointer-events-auto">
            Manifesting your dreams, one pixel at a time ✨
          </p>
       </div>

    </div>
  );
};

export default App;