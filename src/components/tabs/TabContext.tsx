import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Tab {
  id: string;
  path: string;
  title: string;
  closable: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (path: string, title: string, closable?: boolean) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  getTabByPath: (path: string) => Tab | undefined;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const STORAGE_KEY = 'app-tabs';
const DEFAULT_TAB: Tab = {
  id: 'dashboard',
  path: '/dashboard',
  title: 'Gösterge Paneli',
  closable: false,
};

export function TabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  
  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure dashboard tab always exists
        if (!parsed.find((t: Tab) => t.path === '/dashboard')) {
          return [DEFAULT_TAB, ...parsed];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading tabs from localStorage:', e);
    }
    return [DEFAULT_TAB];
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-active`);
      return saved || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // Persist tabs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  // Persist active tab
  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem(`${STORAGE_KEY}-active`, activeTabId);
    }
  }, [activeTabId]);

  const getTabByPath = useCallback((path: string) => {
    return tabs.find(tab => tab.path === path);
  }, [tabs]);

  const addTab = useCallback((path: string, title: string, closable = true) => {
    setTabs(prevTabs => {
      // Check if tab already exists
      const existingTab = prevTabs.find(tab => tab.path === path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return prevTabs;
      }

      // Create new tab
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        path,
        title,
        closable: path !== '/dashboard' && closable,
      };

      setActiveTabId(newTab.id);
      return [...prevTabs, newTab];
    });
  }, []);

  const removeTab = useCallback((id: string) => {
    setTabs(prevTabs => {
      const tabToRemove = prevTabs.find(tab => tab.id === id);
      if (!tabToRemove || !tabToRemove.closable) return prevTabs;

      const tabIndex = prevTabs.findIndex(tab => tab.id === id);
      const newTabs = prevTabs.filter(tab => tab.id !== id);

      // If removing active tab, navigate to adjacent tab
      if (activeTabId === id && newTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        const newActiveTab = newTabs[newActiveIndex];
        setActiveTabId(newActiveTab.id);
        navigate(newActiveTab.path);
      }

      return newTabs;
    });
  }, [activeTabId, navigate]);

  const setActiveTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      navigate(tab.path);
    }
  }, [tabs, navigate]);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, addTab, removeTab, setActiveTab, getTabByPath }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
}
