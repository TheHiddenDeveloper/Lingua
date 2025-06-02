'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

type TextSize = 'text-size-sm' | 'text-size-md' | 'text-size-lg';

interface TextSizeContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TextSizeProvider = ({ children }: { children: ReactNode }) => {
  const [textSize, setTextSizeState] = useState<TextSize>('text-size-md');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedSize = localStorage.getItem('linguaGhanaTextSize') as TextSize | null;
    if (storedSize) {
      setTextSizeState(storedSize);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.body.classList.remove('text-size-sm', 'text-size-md', 'text-size-lg');
      document.body.classList.add(textSize);
      localStorage.setItem('linguaGhanaTextSize', textSize);
    }
  }, [textSize, isMounted]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
  };
  
  if (!isMounted) {
    // Avoid rendering children until client-side hydration is complete to prevent mismatches
    return null; 
  }

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = (): TextSizeContextType => {
  const context = useContext(TextSizeContext);
  if (context === undefined) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
};
