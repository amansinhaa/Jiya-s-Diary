export interface VisionItem {
  id: string;
  type: 'image' | 'quote' | 'goal' | 'note' | 'journal';
  content: string; // URL for image, text for quote/goal/note/journal
  title?: string; // For goals/notes/journal
  color?: string; // Tailwind color class for quotes/notes
  rotation?: string; // CSS rotation for scrapbook feel
  scale?: number; // Scale factor for resizing
  date?: string; // Target date or creation date
  sticker?: string; // Emoji sticker
  fontSize?: string; // Tailwind text size class
  imageFit?: 'cover' | 'contain'; // Image fitting mode
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum GeminiModel {
  CHAT_BASIC = 'gemini-3-flash-preview',
  STUDY_PLANNER = 'gemini-3-pro-preview',
  IMAGE_GEN = 'gemini-3-pro-image-preview',
}