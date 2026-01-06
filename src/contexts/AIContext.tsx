import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { AIRole } from '@/services/aiPersonalityService';

export interface PageContext {
  route: string;
  module?: string;
  entities?: string[];
  entityIds?: string[];
  pageData?: Record<string, any>;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface AIContextType {
  // Widget state
  isWidgetOpen: boolean;
  isWidgetMinimized: boolean;

  // Conversation state
  currentConversationId: string | null;
  messages: AIMessage[];
  isLoading: boolean;

  // Page context
  pageContext: PageContext | null;

  // Role state
  currentRole: AIRole;

  // Widget controls
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  minimizeWidget: () => void;
  maximizeWidget: () => void;

  // Conversation controls
  setCurrentConversationId: (id: string | null) => void;
  addMessage: (message: AIMessage) => void;
  clearMessages: () => void;
  setMessages: (messages: AIMessage[]) => void;
  setIsLoading: (loading: boolean) => void;

  // Context controls
  updatePageContext: (context: PageContext) => void;
  clearPageContext: () => void;

  // Role controls
  setCurrentRole: (role: AIRole) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  // Widget state
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);

  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Page context state
  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  // Role state
  const [currentRole, setCurrentRole] = useState<AIRole>('general');

  // Widget controls
  const openWidget = useCallback(() => {
    setIsWidgetOpen(true);
    setIsWidgetMinimized(false);
    logger.info('AI Widget opened');
  }, []);

  const closeWidget = useCallback(() => {
    setIsWidgetOpen(false);
    logger.info('AI Widget closed');
  }, []);

  const toggleWidget = useCallback(() => {
    setIsWidgetOpen(prev => !prev);
    if (!isWidgetOpen) {
      setIsWidgetMinimized(false);
    }
    logger.info('AI Widget toggled', { isOpen: !isWidgetOpen });
  }, [isWidgetOpen]);

  const minimizeWidget = useCallback(() => {
    setIsWidgetMinimized(true);
    logger.info('AI Widget minimized');
  }, []);

  const maximizeWidget = useCallback(() => {
    setIsWidgetMinimized(false);
    logger.info('AI Widget maximized');
  }, []);

  // Conversation controls
  const addMessage = useCallback((message: AIMessage) => {
    setMessages(prev => [...prev, message]);
    logger.info('AI message added', { role: message.role });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    logger.info('AI messages cleared');
  }, []);

  // Context controls
  const updatePageContext = useCallback((context: PageContext) => {
    setPageContext(context);
    logger.info('Page context updated', {
      route: context.route,
      module: context.module
    });
  }, []);

  const clearPageContext = useCallback(() => {
    setPageContext(null);
    logger.info('Page context cleared');
  }, []);

  const value: AIContextType = {
    // Widget state
    isWidgetOpen,
    isWidgetMinimized,

    // Conversation state
    currentConversationId,
    messages,
    isLoading,

    // Page context
    pageContext,

    // Role state
    currentRole,

    // Widget controls
    openWidget,
    closeWidget,
    toggleWidget,
    minimizeWidget,
    maximizeWidget,

    // Conversation controls
    setCurrentConversationId,
    addMessage,
    clearMessages,
    setMessages,
    setIsLoading,

    // Context controls
    updatePageContext,
    clearPageContext,

    // Role controls
    setCurrentRole,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
