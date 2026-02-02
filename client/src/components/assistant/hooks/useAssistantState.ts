/**
 * Silent Partners - Assistant State Hook
 * 
 * Consolidated state management for the investigative assistant.
 * Replaces 15+ individual useState hooks with a single unified hook.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ProgressStatus } from '../types';

interface UseAssistantStateProps {
  storageKey: string;
}

interface AssistantState {
  messages: ChatMessage[];
  inputValue: string;
  progressStatus: ProgressStatus | null;
  showContext: boolean;
  showEvents: boolean;
  showResearchHistory: boolean;
  isEditingContext: boolean;
}

interface UseAssistantStateReturn extends AssistantState {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setProgressStatus: React.Dispatch<React.SetStateAction<ProgressStatus | null>>;
  setShowContext: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEvents: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResearchHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditingContext: React.Dispatch<React.SetStateAction<boolean>>;
  clearChat: () => void;
  addMessage: (message: ChatMessage) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "I'm your investigative assistant. I can help you research people, companies, and connections. What would you like to investigate?",
  timestamp: new Date().toISOString(),
};

/**
 * Hook for managing assistant state with localStorage persistence
 */
export function useAssistantState({ storageKey }: UseAssistantStateProps): UseAssistantStateReturn {
  // Initialize messages from localStorage or with welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage:', e);
    }
    return [WELCOME_MESSAGE];
  });

  const [inputValue, setInputValue] = useState('');
  const [progressStatus, setProgressStatus] = useState<ProgressStatus | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showResearchHistory, setShowResearchHistory] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage:', e);
    }
  }, [messages, storageKey]);

  // Clear chat and reset to welcome message
  const clearChat = useCallback(() => {
    const newMessages = [{
      id: 'welcome-new',
      role: 'assistant' as const,
      content: "Chat cleared. How can I help with your investigation?",
      timestamp: new Date().toISOString(),
    }];
    setMessages(newMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to clear chat history in localStorage:', e);
    }
  }, [storageKey]);

  // Add a single message
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  return {
    messages,
    inputValue,
    progressStatus,
    showContext,
    showEvents,
    showResearchHistory,
    isEditingContext,
    setMessages,
    setInputValue,
    setProgressStatus,
    setShowContext,
    setShowEvents,
    setShowResearchHistory,
    setIsEditingContext,
    clearChat,
    addMessage,
  };
}

export default useAssistantState;
